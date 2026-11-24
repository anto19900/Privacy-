import { toTime } from './forecast';
import { isoDate } from './format';
import { DEFAULT_RATE, KCAL_PER_KG } from './nutrition';
import { todayIndex } from './plan';
import { sumLogs } from './diary';
import type { FoodLog, Profile, Targets, WeekPlan, WeightEntry } from './types';

const DAY = 86_400_000;

/** Media mobile su 7 giorni (finestra temporale, non numero di pesate). */
export function movingAverage(weights: WeightEntry[]): { date: string; t: number; avg: number }[] {
  return weights.map((w) => {
    const t = toTime(w.date);
    const win = weights.filter((x) => {
      const tx = toTime(x.date);
      return tx <= t && tx > t - 7 * DAY;
    });
    const avg = win.reduce((s, x) => s + x.kg, 0) / win.length;
    return { date: w.date, t, avg: Math.round(avg * 10) / 10 };
  });
}

/** Pendenza (kg/giorno) con regressione lineare ai minimi quadrati. */
function slopePerDay(points: { t: number; kg: number }[]): number {
  const n = points.length;
  const xs = points.map((p) => p.t / DAY);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = points.reduce((a, p) => a + p.kg, 0) / n;
  let num = 0;
  let den = 0;
  points.forEach((p, i) => {
    num += (xs[i] - mx) * (p.kg - my);
    den += (xs[i] - mx) ** 2;
  });
  return den === 0 ? 0 : num / den;
}

export interface AdaptiveEstimate {
  days: number; // ampiezza della finestra analizzata
  weighIns: number;
  loggedDays: number; // giorni con diario completo
  avgIntake: number;
  observedWeeklyKg: number; // variazione reale (kg/settimana, negativa = calo)
  expectedWeeklyKg: number; // variazione voluta
  formulaTdee: number;
  realTdee: number;
  suggestedKcal: number;
  delta: number; // suggerito - attuale
}

export const MIN_DAYS = 14;
const WINDOW_DAYS = 28;

/**
 * Stima il TDEE reale: calorie medie mangiate − (variazione di peso × 7700).
 * Per i giorni senza diario completo si assume che il piano sia stato seguito.
 */
export function estimateAdaptive(
  weights: WeightEntry[],
  foodLog: FoodLog,
  plan: WeekPlan,
  targets: Targets,
  profile: Profile,
  now = new Date(),
): AdaptiveEstimate | null {
  const end = toTime(isoDate(now));
  const startLimit = end - (WINDOW_DAYS - 1) * DAY;
  const pts = weights.map((w) => ({ t: toTime(w.date), kg: w.kg })).filter((p) => p.t >= startLimit && p.t <= end);
  if (pts.length < 4) return null;
  const span = Math.round((pts[pts.length - 1].t - pts[0].t) / DAY);
  if (span < MIN_DAYS) return null;

  // calorie medie nel periodo coperto dalle pesate
  let total = 0;
  let loggedDays = 0;
  const days = span + 1;
  for (let i = 0; i < days; i++) {
    const date = new Date(pts[0].t + i * DAY);
    const iso = isoDate(date);
    const d = todayIndex(date);
    const day = plan.days[d];
    const log = foodLog[iso];
    const planned = day.meals.map((m) => m.key);
    const complete = !!log && planned.every((k) => log[k]);
    if (complete) {
      total += sumLogs(log).kcal;
      loggedDays++;
    } else {
      total += targets.perDay[d].kcal + (targets.freeMeal && targets.freeMeal.day === d ? targets.freeMeal.kcal : 0);
    }
  }
  const avgIntake = total / days;
  const slope = slopePerDay(pts);
  const observedWeeklyKg = slope * 7;
  const realTdee = avgIntake - slope * KCAL_PER_KG;

  const expectedWeeklyKg =
    profile.goal === 'dimagrimento' ? -(profile.weeklyRateKg ?? DEFAULT_RATE) : profile.goal === 'mantenimento' ? 0 : targets.weeklyChangeKg;
  const floor = profile.sex === 'M' ? 1500 : 1200;
  const suggestedKcal = Math.max(floor, Math.round((realTdee + (expectedWeeklyKg * KCAL_PER_KG) / 7) / 10) * 10);

  return {
    days,
    weighIns: pts.length,
    loggedDays,
    avgIntake: Math.round(avgIntake),
    observedWeeklyKg,
    expectedWeeklyKg,
    formulaTdee: targets.tdee,
    realTdee: Math.round(realTdee),
    suggestedKcal,
    delta: suggestedKcal - targets.kcal,
  };
}
