import { useState } from 'react';
import { FOODS } from '../lib/foods';
import { ACTIVITY, calcTargets, DEFAULT_FREE_MEAL, DEFAULT_RATE, FREE_MEAL_SIZES, GOALS, RATE_OPTIONS } from '../lib/nutrition';
import { fmt1 } from '../lib/format';
import type { Activity, DietType, Goal, Profile } from '../lib/types';

export interface FieldsProps {
  value: Profile;
  onChange: (p: Profile) => void;
}

function NumField({ label, value, onChange, suffix }: {
  label: string; value: number; onChange: (n: number) => void; suffix: string;
}) {
  // stato testuale locale: permette di digitare la virgola (es. "72,5")
  const [text, setText] = useState(value ? String(value).replace('.', ',') : '');
  return (
    <label className="block">
      <span className="label">{label}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className="input pr-12 text-lg font-semibold"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/[^0-9.,]/g, '');
            setText(t);
            onChange(parseFloat(t.replace(',', '.')) || 0);
          }}
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>
      </div>
    </label>
  );
}

export function BasicFields({ value: p, onChange }: FieldsProps) {
  const set = (patch: Partial<Profile>) => onChange({ ...p, ...patch });
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="label">Come ti chiami? (facoltativo)</span>
        <input className="input" value={p.name} placeholder="Il tuo nome" onChange={(e) => set({ name: e.target.value })} />
      </label>
      <div>
        <span className="label">Sesso</span>
        <div className="grid grid-cols-2 gap-2">
          {(['F', 'M'] as const).map((s) => (
            <button key={s} type="button" className={p.sex === s ? 'chip-on' : 'chip-off'} onClick={() => set({ sex: s })}>
              {s === 'F' ? '♀ Donna' : '♂ Uomo'}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumField label="Età" value={p.age} onChange={(n) => set({ age: n })} suffix="anni" />
        <NumField label="Altezza" value={p.heightCm} onChange={(n) => set({ heightCm: n })} suffix="cm" />
        <NumField label="Peso attuale" value={p.weightKg} onChange={(n) => set({ weightKg: n })} suffix="kg" />
        <NumField label="Peso obiettivo" value={p.goalWeightKg} onChange={(n) => set({ goalWeightKg: n })} suffix="kg" />
      </div>
    </div>
  );
}

export function ActivityFields({ value: p, onChange }: FieldsProps) {
  return (
    <div className="space-y-2">
      {(Object.keys(ACTIVITY) as Activity[]).map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange({ ...p, activity: a })}
          className={`w-full rounded-2xl border-2 p-4 text-left transition ${p.activity === a ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
        >
          <p className="font-bold text-slate-800">{ACTIVITY[a].label}</p>
          <p className="text-sm text-slate-500">{ACTIVITY[a].desc}</p>
        </button>
      ))}
    </div>
  );
}

export function GoalFields({ value: p, onChange }: FieldsProps) {
  const icons: Record<Goal, string> = { dimagrimento: '📉', mantenimento: '⚖️', massa: '💪' };
  return (
    <div className="space-y-2">
      {(Object.keys(GOALS) as Goal[]).map((g) => (
        <button
          key={g}
          type="button"
          onClick={() => onChange({ ...p, goal: g })}
          className={`flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${p.goal === g ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
        >
          <span className="text-3xl">{icons[g]}</span>
          <div>
            <p className="font-bold text-slate-800">{GOALS[g].label}</p>
            <p className="text-sm text-slate-500">{GOALS[g].desc}</p>
          </div>
        </button>
      ))}
      {p.goal === 'dimagrimento' && <RateFields value={p} onChange={onChange} />}
    </div>
  );
}

/** Scelta del ritmo di calo settimanale con deficit e tempi stimati. */
export function RateFields({ value: p, onChange }: FieldsProps) {
  const rate = p.weeklyRateKg ?? DEFAULT_RATE;
  const t = calcTargets({ ...p, weeklyRateKg: rate });
  const realRate = -t.weeklyChangeKg;
  const toLose = p.weightKg - p.goalWeightKg;
  const weeks = toLose > 0 && realRate > 0 ? Math.ceil(toLose / realRate) : null;
  const date = weeks ? new Date(Date.now() + weeks * 7 * 86_400_000) : null;

  return (
    <div className="card mt-3 space-y-3 border-emerald-200">
      <div>
        <p className="font-bold text-slate-800">Quanti kg vuoi perdere a settimana?</p>
        <p className="text-xs text-slate-500">Valore teorico: 1 kg di grasso ≈ 7.700 kcal di deficit.</p>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {RATE_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onChange({ ...p, weeklyRateKg: r })}
            className={`rounded-xl border py-3 text-sm font-bold ${rate === r ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}
          >
            {r.toLocaleString('it-IT', { maximumFractionDigits: 2 })}
            <span className="block text-[10px] font-medium opacity-80">kg</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-rose-50 p-2.5">
          <p className="text-lg font-extrabold text-rose-600">−{Math.abs(t.dailyDelta)}</p>
          <p className="text-xs text-slate-500">kcal/giorno di deficit</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2.5">
          <p className="text-lg font-extrabold text-emerald-700">{t.kcal}</p>
          <p className="text-xs text-slate-500">kcal/giorno da mangiare</p>
        </div>
      </div>
      {weeks && date && (
        <p className="rounded-xl bg-sage-50 p-3 text-sm text-slate-700">
          📅 Obiettivo <b>{fmt1(p.goalWeightKg)} kg</b> in circa <b>{weeks} settimane</b>, verso il{' '}
          <b>{date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</b>.
        </p>
      )}
      {t.floorApplied && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Per sicurezza non scendiamo sotto {p.sex === 'M' ? '1500' : '1200'} kcal: il calo reale stimato è di circa{' '}
          <b>{fmt1(realRate)} kg/settimana</b>.
        </p>
      )}
      {rate >= 1.25 && !t.floorApplied && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Ritmo impegnativo: è consigliabile farsi seguire da un professionista.
        </p>
      )}
    </div>
  );
}

const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

/** Pasto libero settimanale: giorno, pasto e dimensione, conteggiato nel bilancio della settimana. */
export function FreeMealFields({ value: p, onChange }: FieldsProps) {
  const fm = p.freeMeal ?? DEFAULT_FREE_MEAL;
  const set = (patch: Partial<typeof fm>) => onChange({ ...p, freeMeal: { ...fm, ...patch } });
  const t = calcTargets({ ...p, freeMeal: fm });
  const normal = t.perDay[(fm.day + 1) % 7];

  return (
    <div className="card space-y-4">
      <button type="button" onClick={() => set({ enabled: !fm.enabled })} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="font-bold text-slate-800">🍕 Un pasto libero a settimana</p>
          <p className="text-sm text-slate-500">Pizza, cena fuori… senza pesare nulla</p>
        </div>
        <span className={`flex h-8 w-14 items-center rounded-full p-1 transition ${fm.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
          <span className={`h-6 w-6 rounded-full bg-white shadow transition ${fm.enabled ? 'translate-x-6' : ''}`} />
        </span>
      </button>
      {fm.enabled && (
        <>
          <div>
            <span className="label">Giorno</span>
            <div className="grid grid-cols-7 gap-1">
              {DAY_SHORT.map((d, i) => (
                <button key={d} type="button" onClick={() => set({ day: i })} className={`rounded-lg border py-2.5 text-xs font-bold ${fm.day === i ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Pasto</span>
            <div className="grid grid-cols-2 gap-2">
              {(['pranzo', 'cena'] as const).map((m) => (
                <button key={m} type="button" className={fm.meal === m ? 'chip-on' : 'chip-off'} onClick={() => set({ meal: m })}>
                  {m === 'pranzo' ? '☀️ Pranzo' : '🌙 Cena'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Quanto abbondante?</span>
            <div className="grid grid-cols-3 gap-2">
              {FREE_MEAL_SIZES.map((sz) => (
                <button key={sz.kcal} type="button" onClick={() => set({ kcal: sz.kcal })} className={`rounded-xl border py-2.5 text-sm font-semibold ${fm.kcal === sz.kcal ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
                  {sz.label}
                  <span className="block text-[11px] font-normal opacity-80">{sz.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-xl bg-sage-50 p-3 text-sm text-slate-700">
            ⚖️ Per compensare, gli altri giorni scendono a <b>{normal.kcal} kcal</b> (da {t.kcal}): le proteine restano a{' '}
            <b>{normal.p}g</b>, si riducono un po' carboidrati e grassi. La media settimanale resta {t.kcal} kcal.
          </p>
          {t.freeMeal?.capped && (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ Con le tue calorie non si può scendere oltre negli altri giorni: il pasto libero è limitato a circa{' '}
              <b>{t.freeMeal.kcal} kcal</b>.
            </p>
          )}
        </>
      )}
    </div>
  );
}

const DIETS: { id: DietType; label: string }[] = [
  { id: 'onnivoro', label: '🍖 Onnivoro' },
  { id: 'pescetariano', label: '🐟 Pescetariano' },
  { id: 'vegetariano', label: '🥚 Vegetariano' },
  { id: 'vegano', label: '🌱 Vegano' },
];

export function PreferenceFields({ value: p, onChange }: FieldsProps) {
  const set = (patch: Partial<Profile>) => onChange({ ...p, ...patch });
  const toggleFood = (id: string) =>
    set({ excludedFoods: p.excludedFoods.includes(id) ? p.excludedFoods.filter((x) => x !== id) : [...p.excludedFoods, id] });

  return (
    <div className="space-y-5">
      <div>
        <span className="label">Regime alimentare</span>
        <div className="grid grid-cols-2 gap-2">
          {DIETS.map((d) => (
            <button key={d.id} type="button" className={p.diet === d.id ? 'chip-on' : 'chip-off'} onClick={() => set({ diet: d.id })}>
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Intolleranze</span>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={p.lactoseFree ? 'chip-on' : 'chip-off'} onClick={() => set({ lactoseFree: !p.lactoseFree })}>
            🥛 Senza lattosio
          </button>
          <button type="button" className={p.glutenFree ? 'chip-on' : 'chip-off'} onClick={() => set({ glutenFree: !p.glutenFree })}>
            🌾 Senza glutine
          </button>
        </div>
      </div>
      <div>
        <span className="label">Alimenti da escludere (tocca per escludere)</span>
        <div className="flex flex-wrap gap-2">
          {FOODS.map((f) => {
            const off = p.excludedFoods.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleFood(f.id)}
                className={`rounded-full border px-3 py-2 text-sm ${off ? 'border-rose-300 bg-rose-50 text-rose-700 line-through' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                {f.emoji} {f.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function validateBasics(p: Profile): string | null {
  if (!(p.age >= 14 && p.age <= 100)) return "Inserisci un'età tra 14 e 100 anni.";
  if (!(p.heightCm >= 120 && p.heightCm <= 230)) return "Inserisci un'altezza tra 120 e 230 cm.";
  if (!(p.weightKg >= 35 && p.weightKg <= 250)) return 'Inserisci un peso attuale valido.';
  if (!(p.goalWeightKg >= 35 && p.goalWeightKg <= 250)) return 'Inserisci un peso obiettivo valido.';
  return null;
}

export const DEFAULT_PROFILE: Profile = {
  name: '',
  age: 30,
  sex: 'F',
  heightCm: 165,
  weightKg: 65,
  goalWeightKg: 60,
  activity: 'leggero',
  goal: 'dimagrimento',
  weeklyRateKg: DEFAULT_RATE,
  freeMeal: DEFAULT_FREE_MEAL,
  diet: 'onnivoro',
  lactoseFree: false,
  glutenFree: false,
  excludedFoods: [],
};
