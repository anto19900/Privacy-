import type { Profile } from '../src/lib/types';

export const BASE: Profile = {
  name: '',
  age: 33,
  sex: 'M',
  heightCm: 178,
  weightKg: 80,
  goalWeightKg: 72,
  activity: 'leggero',
  goal: 'dimagrimento',
  weeklyRateKg: 0.5,
  diet: 'onnivoro',
  lactoseFree: false,
  glutenFree: false,
  excludedFoods: [],
};

export const profile = (patch: Partial<Profile> = {}): Profile => ({ ...BASE, ...patch });

/** errore relativo massimo tra macro ottenuti e target */
export function maxRelErr(got: { p: number; c: number; f: number }, t: { p: number; c: number; f: number }): number {
  return Math.max(Math.abs(got.p - t.p) / t.p, Math.abs(got.c - t.c) / t.c, Math.abs(got.f - t.f) / t.f);
}
