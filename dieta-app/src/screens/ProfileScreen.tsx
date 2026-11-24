import { Save } from 'lucide-react';
import { useState } from 'react';
import { MacroSummary } from '../components/MacroSummary';
import { RemindersFields } from '../components/RemindersFields';
import { BackupFields } from '../components/BackupFields';
import { TherapyFields } from '../components/Therapy';
import { ActivityFields, BasicFields, FreeMealFields, GoalFields, PlanStyleFields, PreferenceFields, validateBasics } from '../components/ProfileFields';
import { calcTargets } from '../lib/nutrition';
import { useStore } from '../lib/store';
import type { Profile } from '../lib/types';

export function ProfileScreen() {
  const { profile, saveProfile, resetAll, updateProfile } = useStore();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!draft) return null;

  const t = calcTargets(draft);
  const save = () => {
    const err = validateBasics(draft);
    if (err) return setMsg({ ok: false, text: err });
    const regen = confirm('Vuoi rigenerare il piano settimanale con i nuovi dati?\n\nOK = rigenera · Annulla = salva solo il profilo');
    saveProfile(draft, regen);
    setMsg({ ok: true, text: regen ? 'Profilo salvato e piano rigenerato ✅' : 'Profilo salvato ✅' });
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold text-slate-900">Profilo</h1>
      <MacroSummary
        title="Media giornaliera settimanale"
        target={{ kcal: t.kcal, p: t.proteinG, c: t.carbsG, f: t.fatG }}
        note={
          t.freeMeal
            ? `Giorni normali: ${t.perDay[(t.freeMeal.day + 1) % 7].kcal} kcal (P ${t.perDay[(t.freeMeal.day + 1) % 7].p}g · C ${t.perDay[(t.freeMeal.day + 1) % 7].c}g · G ${t.perDay[(t.freeMeal.day + 1) % 7].f}g) + pasto libero ~${t.freeMeal.kcal} kcal.`
            : undefined
        }
      />
      <p className="-mt-2 text-xs text-slate-500">
        BMR {t.bmr} kcal · TDEE {t.tdee} kcal (Mifflin-St Jeor)
        {t.dailyDelta !== 0 && ` · ${t.dailyDelta < 0 ? 'deficit' : 'surplus'} ${Math.abs(t.dailyDelta)} kcal/giorno`}
      </p>

      <Section title="Dati personali"><BasicFields value={draft} onChange={setDraft} /></Section>
      <Section title="Attività fisica"><ActivityFields value={draft} onChange={setDraft} /></Section>
      <Section title="Obiettivo"><GoalFields value={draft} onChange={setDraft} /></Section>
      <Section title="Varietà e allenamento"><PlanStyleFields value={draft} onChange={setDraft} /></Section>
      <Section title="Pasto libero"><FreeMealFields value={draft} onChange={setDraft} /></Section>
      <Section title="Preferenze alimentari"><PreferenceFields value={draft} onChange={setDraft} /></Section>

      <Section title="Aspetto">
        <div className="grid grid-cols-3 gap-2">
          {([['system', '📱 Sistema'], ['light', '☀️ Chiaro'], ['dark', '🌙 Scuro']] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={(profile?.theme ?? 'system') === id ? 'chip-on' : 'chip-off'}
              onClick={() => {
                updateProfile({ theme: id });
                setDraft((d) => (d ? { ...d, theme: id } : d));
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>
      <Section title="💊 Terapia">
        <TherapyFields />
      </Section>
      <Section title="Promemoria (si salvano subito)"><RemindersFields /></Section>
      <Section title="Backup ed export"><BackupFields /></Section>

      {msg && <p className={`rounded-xl p-3 text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
      <button className="btn-primary w-full text-base" onClick={save}>
        <Save size={20} /> Salva profilo
      </button>
      <button
        className="btn w-full text-rose-600 active:bg-rose-50"
        onClick={() => {
          if (confirm('Cancellare tutti i dati (profilo, piano, pesate, lista)?')) resetAll();
        }}
      >
        Cancella tutti i dati
      </button>
      <p className="text-center text-xs text-slate-400">I dati restano solo su questo telefono. Valori indicativi, non sostituiscono il parere di un professionista.</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-sage-600">{title}</h2>
      {children}
    </section>
  );
}
