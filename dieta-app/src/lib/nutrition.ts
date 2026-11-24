import type { Activity, Goal, Profile, Targets } from './types';

export const ACTIVITY: Record<Activity, { label: string; desc: string; factor: number }> = {
  sedentario: { label: 'Sedentario', desc: 'Lavoro da scrivania, poco movimento', factor: 1.2 },
  leggero: { label: 'Leggero', desc: '1-3 allenamenti a settimana', factor: 1.375 },
  moderato: { label: 'Moderato', desc: '3-5 allenamenti a settimana', factor: 1.55 },
  intenso: { label: 'Intenso', desc: '6-7 allenamenti o lavoro fisico', factor: 1.725 },
};

/** kcal contenute in circa 1 kg di grasso corporeo */
export const KCAL_PER_KG = 7700;
export const RATE_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5];
export const DEFAULT_RATE = 0.5;

export const GOALS: Record<Goal, { label: string; desc: string; kcalDelta: number; proteinPerKg: number }> = {
  dimagrimento: { label: 'Dimagrimento', desc: 'Scegli tu quanti kg perdere a settimana', kcalDelta: 0, proteinPerKg: 2.0 },
  mantenimento: { label: 'Mantenimento', desc: 'Calorie pari al fabbisogno', kcalDelta: 0, proteinPerKg: 1.6 },
  massa: { label: 'Ricomposizione / Massa', desc: 'Leggero surplus del 10%', kcalDelta: 0.1, proteinPerKg: 1.8 },
};

/** BMR con formula Mifflin-St Jeor. */
export function calcBmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'M' ? base + 5 : base - 161;
}

export function calcTargets(p: Profile): Targets {
  const bmr = calcBmr(p);
  const tdee = bmr * ACTIVITY[p.activity].factor;
  const goal = GOALS[p.goal];
  const floor = p.sex === 'M' ? 1500 : 1200;
  const wanted =
    p.goal === 'dimagrimento'
      ? tdee - ((p.weeklyRateKg ?? DEFAULT_RATE) * KCAL_PER_KG) / 7
      : tdee * (1 + goal.kcalDelta);
  const rounded = Math.round(wanted / 10) * 10;
  const kcal = Math.max(floor, rounded);
  const dailyDelta = Math.round(kcal - tdee);
  const weeklyChangeKg = (dailyDelta * 7) / KCAL_PER_KG;

  // proteine per kg, ma mai oltre il 35% delle kcal (evita carboidrati a zero con diete basse)
  const proteinG = Math.round(Math.min(goal.proteinPerKg * p.weightKg, (kcal * 0.35) / 4));
  // grassi: almeno il 25% delle kcal, fino a 0,8 g/kg senza superare il 30%
  const fatG = Math.round(Math.max((kcal * 0.25) / 9, Math.min(0.8 * p.weightKg, (kcal * 0.3) / 9)));
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    dailyDelta,
    weeklyChangeKg,
    floorApplied: rounded < floor,
    proteinG,
    carbsG,
    fatG,
  };
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiTone(bmi: number): string {
  if (bmi < 18.5) return 'bg-sky-50 text-sky-700';
  if (bmi < 25) return 'bg-emerald-50 text-emerald-700';
  if (bmi < 30) return 'bg-amber-50 text-amber-700';
  return 'bg-rose-50 text-rose-700';
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sovrappeso';
  return 'Obesità';
}
