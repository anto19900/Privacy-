import { Bell } from 'lucide-react';
import { useState } from 'react';
import { notificationsSupported, REMINDER_INFO } from '../lib/notifications';
import { useStore } from '../lib/store';
import type { Reminder, Reminders } from '../lib/types';

const DAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Impostazioni dei promemoria: applicate subito (non serve "Salva profilo"). */
export function RemindersFields() {
  const { reminders, setReminders } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const supported = notificationsSupported();

  const update = async (key: keyof Reminders, patch: Partial<Reminder>) => {
    const res = await setReminders({ ...reminders, [key]: { ...reminders[key], ...patch } });
    setMsg(
      res === 'denied'
        ? '⚠️ Notifiche non autorizzate: abilitale nelle impostazioni Android per questa app.'
        : res === 'unsupported'
          ? "ℹ️ I promemoria funzionano nell'app Android installata (non nel browser)."
          : res === 'error'
            ? '⚠️ Impossibile programmare i promemoria.'
            : null,
    );
  };

  return (
    <div className="card space-y-4">
      {!supported && <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">ℹ️ I promemoria funzionano nell'app Android installata.</p>}
      {(Object.keys(REMINDER_INFO) as (keyof Reminders)[]).map((key) => {
        const r = reminders[key];
        const info = REMINDER_INFO[key];
        const days = key === 'mamma' ? [-1, ...DAYS.map((_, i) => i)] : DAYS.map((_, i) => i);
        return (
          <div key={key} className="space-y-2 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => void update(key, { enabled: !r.enabled })}>
              <div>
                <p className="font-bold text-slate-800">
                  {info.emoji} {info.label}
                </p>
                <p className="text-xs text-slate-500">{info.body}</p>
              </div>
              <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${r.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`h-6 w-6 rounded-full bg-white shadow transition ${r.enabled ? 'translate-x-6' : ''}`} />
              </span>
            </button>
            {r.enabled && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {days.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => void update(key, { weekday: d })}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-bold ${r.weekday === d ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      {d === -1 ? 'Ogni giorno' : DAYS[d]}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-3">
                  <Bell size={18} className="text-slate-400" />
                  <span className="text-sm text-slate-600">Ora</span>
                  <input
                    type="time"
                    className="input w-36 py-2"
                    value={`${pad(r.hour)}:${pad(r.minute)}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      if (Number.isFinite(h) && Number.isFinite(m)) void update(key, { hour: h, minute: m });
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        );
      })}
      {msg && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{msg}</p>}
    </div>
  );
}
