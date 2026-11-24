import type { Activity, FreeMeal, Goal, MacroTarget, MealKey, Profile, Targets } from './types';

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

/** Ripartizione delle calorie giornaliere tra i 5 pasti. */
export const MEAL_SHARES: Record<MealKey, number> = {
  colazione: 0.22,
  spuntino: 0.1,
  pranzo: 0.33,
  merenda: 0.1,
  cena: 0.25,
};

export const FREE_MEAL_SIZES = [
  { kcal: 600, label: 'Leggero', desc: '~600 kcal' },
  { kcal: 900, label: 'Medio', desc: '~900 kcal' },
  { kcal: 1200, label: 'Abbondante', desc: '~1200 kcal' },
];

export const DEFAULT_FREE_MEAL: FreeMeal = { enabled: true, day: 5, meal: 'cena', kcal: 900 };

/** BMR con formula Mifflin-St Jeor. */
export function calcBmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === 'M' ? base + 5 : base - 161;
}

function splitMacros(kcal: number, proteinG: number, fatRatio: number): MacroTarget {
  const p = Math.round(proteinG);
  const f = Math.round((kcal * fatRatio) / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { kcal: Math.round(kcal), p, c, f };
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

  // Proteine: g/kg sul peso di riferimento (in dimagrimento il peso obiettivo), max 35% delle kcal
  const refWeight = p.goal === 'dimagrimento' ? Math.min(p.weightKg, Math.max(p.goalWeightKg, 40)) : p.weightKg;
  const proteinG = Math.min(goal.proteinPerKg * refWeight, (kcal * 0.35) / 4);
  // Grassi: 25-30% delle kcal (circa 0,8 g/kg)
  const fatRatio = Math.min(0.3, Math.max(0.25, (0.8 * p.weightKg * 9) / kcal));
  const avg = splitMacros(kcal, proteinG, fatRatio);

  // ---- Pasto libero: la settimana resta a 7 × kcal ----
  const fm = p.freeMeal ?? DEFAULT_FREE_MEAL;
  let perDay: MacroTarget[] = Array.from({ length: 7 }, () => ({ ...avg }));
  let freeMeal: Targets['freeMeal'] = null;
  if (fm.enabled) {
    const s = MEAL_SHARES[fm.meal];
    let freeKcal = fm.kcal;
    let normal = (7 * kcal - freeKcal) / (7 - s);
    let capped = false;
    if (normal < floor) {
      normal = Math.min(kcal, floor);
      freeKcal = Math.max(s * normal, 7 * kcal - (7 - s) * normal);
      capped = true;
    }
    // proteine invariate nei giorni normali: il taglio cade su carboidrati e grassi
    const normalDay = splitMacros(normal, avg.p, fatRatio);
    const freeDay: MacroTarget = {
      kcal: Math.round(normalDay.kcal * (1 - s)),
      p: Math.round(normalDay.p * (1 - s)),
      c: Math.round(normalDay.c * (1 - s)),
      f: Math.round(normalDay.f * (1 - s)),
    };
    perDay = perDay.map((_, i) => (i === fm.day ? freeDay : { ...normalDay }));
    freeMeal = { ...fm, kcal: Math.round(freeKcal / 10) * 10, capped };
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    kcal,
    dailyDelta,
    weeklyChangeKg,
    floorApplied: rounded < floor,
    proteinG: avg.p,
    carbsG: avg.c,
    fatG: avg.f,
    perDay,
    freeMeal,
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
