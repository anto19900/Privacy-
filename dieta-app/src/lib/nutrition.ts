import type { Activity, Goal, Profile, Targets } from './types';

export const ACTIVITY: Record<Activity, { label: string; desc: string; factor: number }> = {
  sedentario: { label: 'Sedentario', desc: 'Lavoro da scrivania, poco movimento', factor: 1.2 },
  leggero: { label: 'Leggero', desc: '1-3 allenamenti a settimana', factor: 1.375 },
  moderato: { label: 'Moderato', desc: '3-5 allenamenti a settimana', factor: 1.55 },
  intenso: { label: 'Intenso', desc: '6-7 allenamenti o lavoro fisico', factor: 1.725 },
};

export const GOALS: Record<Goal, { label: string; desc: string; kcalDelta: number; proteinPerKg: number }> = {
  dimagrimento: { label: 'Dimagrimento', desc: 'Deficit calorico del 20%', kcalDelta: -0.2, proteinPerKg: 2.0 },
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
  const kcal = Math.max(floor, Math.round((tdee * (1 + goal.kcalDelta)) / 10) * 10);

  const proteinG = Math.round(goal.proteinPerKg * p.weightKg);
  const fatG = Math.round(Math.max((kcal * 0.25) / 9, 0.8 * p.weightKg));
  const carbsG = Math.max(0, Math.round((kcal - proteinG * 4 - fatG * 9) / 4));

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, proteinG, carbsG, fatG };
}

export function calcBmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sovrappeso';
  return 'Obesità';
}
