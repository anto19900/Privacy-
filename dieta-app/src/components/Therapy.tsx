import { AlarmClock, Check, Pill, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fmtDate, isoDate } from '../lib/format';
import { exactAlarmsAllowed, notificationsSupported, openExactAlarmSettings } from '../lib/notifications';
import { useStore } from '../lib/store';
import { addDays, checkupDate, phases, therapyStatus, WEGOVY_PILLS_PRESET } from '../lib/therapy';
import type { Therapy } from '../lib/types';

const long = (iso: string) => fmtDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });
const pad = (n: number) => String(n).padStart(2, '0');

/** Riquadro in "Oggi": dose del giorno, mese di terapia e spunta "presa". */
export function TherapyCard() {
  const { therapy: t, therapyLog, markTherapy } = useStore();
  const today = isoDate();
  const st = therapyStatus(t, therapyLog, today);
  if (st.kind === 'off') return null;
  const chk = checkupDate(t);

  if (st.kind === 'before') {
    return (
      <div className="card flex items-center gap-3 border-sky-200 bg-sky-50">
        <Pill className="shrink-0 text-sky-700" />
        <p className="text-sm text-slate-700">
          <b>{t.name}</b>: si inizia il <b>{long(t.startDate)}</b> con {t.steps[0]?.dose} ({st.daysToStart === 1 ? 'domani' : `tra ${st.daysToStart} giorni`}).
        </p>
      </div>
    );
  }

  if (st.kind === 'ended') {
    if (!chk || today > addDays(chk, 45)) return null;
    return (
      <div className="card space-y-1 border-amber-200 bg-amber-50">
        <p className="font-bold text-slate-800">🩺 {t.checkupMonth}° mese: controllo dal medico</p>
        <p className="text-sm text-slate-700">{t.checkupNote}</p>
        <p className="text-xs text-slate-500">Lo schema impostato è concluso: per il seguito segui le nuove indicazioni del medico e aggiorna la terapia nel Profilo.</p>
      </div>
    );
  }

  return (
    <div className={`card space-y-3 ${st.taken ? 'border-emerald-200' : 'border-sky-200'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          <Pill />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-extrabold text-slate-900">
            {t.name} {st.phase.dose}
          </p>
          <p className="text-sm text-slate-600">{t.instructions}</p>
          <p className="mt-1 text-xs font-medium text-sky-700">
            {st.month}° mese · giorno {st.dayOfMonth}/{st.daysInMonth} · promemoria alle {pad(t.hour)}:{pad(t.minute)}
          </p>
        </div>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-sky-400" style={{ width: `${(st.dayOfMonth / st.daysInMonth) * 100}%` }} />
      </div>
      <p className="text-xs text-slate-500">
        {st.nextDose
          ? `Tra ${st.daysToNext} ${st.daysToNext === 1 ? 'giorno' : 'giorni'} si passa a ${st.nextDose}.`
          : chk
            ? `Controllo dal medico dal ${long(chk)}.`
            : `Fine dello schema tra ${st.daysToNext} giorni.`}
      </p>
      {st.taken ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
            <Check size={16} /> Presa oggi
          </span>
          <button className="ml-auto rounded-lg px-3 py-2 text-sm text-slate-500 active:bg-slate-100" onClick={() => markTherapy(today, false)}>
            Annulla
          </button>
        </div>
      ) : (
        <button className="btn w-full bg-sky-600 text-white active:bg-sky-700" onClick={() => markTherapy(today, true)}>
          <Check size={20} /> Segna come presa
        </button>
      )}
    </div>
  );
}

/** Impostazioni in "Profilo": data di inizio, orario, schema a step, timeline. */
export function TherapyFields() {
  const { therapy, saveTherapy } = useStore();
  const [t, setT] = useState<Therapy>(therapy);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [exact, setExact] = useState(true);
  useEffect(() => {
    void exactAlarmsAllowed().then(setExact);
  }, []);

  const set = (patch: Partial<Therapy>) => setT((x) => ({ ...x, ...patch }));
  const save = async (next: Therapy) => {
    const res = await saveTherapy(next);
    setMsg(
      res === 'ok'
        ? { ok: true, text: next.enabled ? 'Terapia salvata e promemoria programmati ✅' : 'Promemoria della terapia disattivati.' }
        : res === 'unsupported'
          ? { ok: true, text: "Salvata. I promemoria suoneranno nell'app Android installata." }
          : res === 'denied'
            ? { ok: false, text: 'Notifiche non autorizzate: abilitale nelle impostazioni Android.' }
            : { ok: false, text: 'Impossibile programmare i promemoria.' },
    );
  };

  if (!t.enabled) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-slate-600">Promemoria quotidiano del farmaco con dose che cambia mese per mese, avvisi di cambio dose e del controllo.</p>
        <button
          className="btn-primary w-full"
          onClick={() => {
            const next = { ...WEGOVY_PILLS_PRESET, ...(therapy.name ? { startDate: therapy.startDate, hour: therapy.hour, minute: therapy.minute } : {}), enabled: true };
            setT(next);
          }}
        >
          <Pill size={20} /> Imposta Wegovy pills (1,5 → 4 → 9 mg)
        </button>
        <button className="btn-ghost w-full" onClick={() => setT({ ...WEGOVY_PILLS_PRESET, name: 'Farmaco', steps: [{ months: 1, dose: '' }], checkupMonth: undefined, checkupNote: '', enabled: true })}>
          <Plus size={20} /> Altra terapia
        </button>
      </div>
    );
  }

  const phs = phases(t);
  const chk = checkupDate(t);
  return (
    <div className="card space-y-4">
      <label className="block">
        <span className="label">Farmaco</span>
        <input className="input" value={t.name} onChange={(e) => set({ name: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="label">Data di inizio</span>
          <input type="date" className="input" value={t.startDate} onChange={(e) => e.target.value && set({ startDate: e.target.value })} />
        </label>
        <label className="block">
          <span className="label">Ora promemoria</span>
          <input
            type="time"
            className="input"
            value={`${pad(t.hour)}:${pad(t.minute)}`}
            onChange={(e) => {
              const [h, m] = e.target.value.split(':').map(Number);
              if (Number.isFinite(h) && Number.isFinite(m)) set({ hour: h, minute: m });
            }}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs text-slate-500">Imposta l'ora mezz'ora prima del pasto principale in cui la prendi (es. 12:30 se pranzi alle 13).</p>
      <label className="block">
        <span className="label">Come assumerla</span>
        <input className="input" value={t.instructions} onChange={(e) => set({ instructions: e.target.value })} />
      </label>

      <div>
        <span className="label">Schema delle dosi</span>
        <div className="space-y-2">
          {t.steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input w-24 px-3"
                inputMode="numeric"
                value={s.months || ''}
                onChange={(e) => set({ steps: t.steps.map((x, j) => (j === i ? { ...x, months: Math.max(0, parseInt(e.target.value, 10) || 0) } : x)) })}
              />
              <span className="text-sm text-slate-500">{s.months === 1 ? 'mese' : 'mesi'} a</span>
              <input className="input flex-1 px-3" placeholder="dose" value={s.dose} onChange={(e) => set({ steps: t.steps.map((x, j) => (j === i ? { ...x, dose: e.target.value } : x)) })} />
              <button className="rounded-lg p-2 text-slate-400 active:bg-rose-50" aria-label="Togli" onClick={() => set({ steps: t.steps.filter((_, j) => j !== i) })}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          <button className="text-sm font-semibold text-emerald-700" onClick={() => set({ steps: [...t.steps, { months: 1, dose: t.steps[t.steps.length - 1]?.dose ?? '' }] })}>
            + Aggiungi step
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 items-end gap-2">
        <label className="block">
          <span className="label">Controllo al</span>
          <input
            className="input px-3"
            inputMode="numeric"
            value={t.checkupMonth ?? ''}
            onChange={(e) => set({ checkupMonth: parseInt(e.target.value, 10) || undefined })}
          />
        </label>
        <p className="col-span-2 pb-3 text-sm text-slate-500">° mese (vuoto = nessuno)</p>
      </div>
      {t.checkupMonth && (
        <label className="block">
          <span className="label">Esami / note per il controllo</span>
          <textarea className="input min-h-[80px]" value={t.checkupNote ?? ''} onChange={(e) => set({ checkupNote: e.target.value })} />
        </label>
      )}

      {/* timeline */}
      <div className="rounded-2xl bg-slate-50 p-3">
        <p className="mb-2 text-sm font-bold text-slate-700">Calendario</p>
        <ol className="space-y-2">
          {phs.filter((p) => p.months > 0).map((p) => (
            <li key={p.index} className="flex gap-3 text-sm">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-sky-500" />
              <span>
                <b>
                  {t.name} {p.dose || '—'}
                </b>{' '}
                · {p.months === 1 ? `${p.firstMonth}° mese` : `${p.firstMonth}°–${p.firstMonth + p.months - 1}° mese`}
                <br />
                <span className="text-slate-500">
                  dal {long(p.from)} al {long(addDays(p.to, -1))}
                </span>
              </span>
            </li>
          ))}
          {chk && (
            <li className="flex gap-3 text-sm">
              <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-amber-500" />
              <span>
                <b>🩺 Controllo</b> · {t.checkupMonth}° mese, dal {long(chk)}
                <br />
                <span className="text-slate-500">promemoria per prenotare il {long(addDays(chk, -7))}</span>
              </span>
            </li>
          )}
        </ol>
      </div>

      {notificationsSupported() && !exact && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <p>⏰ Per far suonare il promemoria all'orario esatto, consenti "Sveglie e promemoria" all'app.</p>
          <button className="mt-2 inline-flex items-center gap-1.5 font-semibold underline" onClick={() => void openExactAlarmSettings().then(() => exactAlarmsAllowed().then(setExact))}>
            <AlarmClock size={16} /> Apri impostazioni
          </button>
        </div>
      )}

      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
      <button className="btn-primary w-full" onClick={() => void save({ ...t, steps: t.steps.filter((s) => s.months > 0 && s.dose.trim()) })}>
        <Check size={20} /> Salva terapia e promemoria
      </button>
      <button
        className="btn w-full text-rose-600 active:bg-rose-50"
        onClick={() => {
          if (confirm('Disattivare i promemoria della terapia?')) {
            const off = { ...t, enabled: false };
            setT(off);
            void save(off);
          }
        }}
      >
        Disattiva terapia
      </button>
      <p className="text-center text-xs text-slate-400">Solo un promemoria: dosi e tempi sono quelli indicati dal tuo medico.</p>
    </div>
  );
}
