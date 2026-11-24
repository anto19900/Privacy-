import { isoDate } from './format';
import type { WeightEntry } from './types';

export interface ForecastPoint {
  t: number; // timestamp
  kg: number;
}

export interface Forecast {
  points: ForecastPoint[];
  /** Data stimata di raggiungimento obiettivo (null se non raggiungibile col ritmo attuale) */
  goalDate: Date | null;
  weeks: number | null;
}

const DAY = 86_400_000;
const MAX_WEEKS = 104;

export function toTime(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/**
 * Proiezione teorica lineare: parte dall'ultima pesata e segue la variazione
 * settimanale prevista dal deficit/surplus finché non tocca il peso obiettivo.
 */
export function buildForecast(weights: WeightEntry[], fallbackKg: number, goalKg: number, weeklyChangeKg: number): Forecast {
  const last = weights[weights.length - 1];
  const startT = last ? toTime(last.date) : toTime(isoDate());
  const startKg = last ? last.kg : fallbackKg;
  const diff = goalKg - startKg;

  // il ritmo deve andare nella direzione dell'obiettivo
  if (Math.abs(diff) < 0.05 || Math.abs(weeklyChangeKg) < 0.01 || Math.sign(diff) !== Math.sign(weeklyChangeKg)) {
    return { points: [], goalDate: null, weeks: null };
  }

  const weeks = diff / weeklyChangeKg;
  const total = Math.min(weeks, MAX_WEEKS);
  const points: ForecastPoint[] = [{ t: startT, kg: startKg }];
  for (let w = 1; w < total; w++) points.push({ t: startT + w * 7 * DAY, kg: round1(startKg + w * weeklyChangeKg) });
  points.push({ t: startT + total * 7 * DAY, kg: round1(startKg + total * weeklyChangeKg) });

  return {
    points,
    goalDate: weeks <= MAX_WEEKS ? new Date(startT + weeks * 7 * DAY) : null,
    weeks: weeks <= MAX_WEEKS ? Math.ceil(weeks) : null,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
