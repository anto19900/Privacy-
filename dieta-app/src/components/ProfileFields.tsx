import { useState } from 'react';
import { FOODS } from '../lib/foods';
import { ACTIVITY, GOALS } from '../lib/nutrition';
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
  diet: 'onnivoro',
  lactoseFree: false,
  glutenFree: false,
  excludedFoods: [],
};
