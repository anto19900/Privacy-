import { isoDate } from './format';
import { sumMacros, todayIndex } from './plan';
import { optimizeDay } from './solver';
import type { DayLog, DayPlan, FoodLog, MacroTarget, Meal, MealLog, Targets, WeekPlan } from './types';

export const ZERO: MacroTarget = { kcal: 0, p: 0, c: 0, f: 0 };

export function mealMacros(meal: Meal): MacroTarget {
  const m = sumMacros(meal.items);
  return { kcal: m.kcal, p: m.p, c: m.c, f: m.f };
}

export function logDone(meal: Meal, freeKcal = 0): MealLog {
  if (meal.free) {
    // pasto libero: stima con ripartizione "media" dei macro
    return { status: 'done', kcal: freeKcal, p: (freeKcal * 0.15) / 4, c: (freeKcal * 0.5) / 4, f: (freeKcal * 0.35) / 9 };
  }
  return { status: 'done', ...mealMacros(meal), items: meal.items.filter((i) => i.grams > 0).map((i) => ({ ...i })) };
}

export function logSkipped(): MealLog {
  return { status: 'skipped', ...ZERO };
}

/** Pasto diverso dal previsto: macro stimati in proporzione al pasto pianificato. */
export function logOther(meal: Meal, kcal: number, freeKcal = 0): MealLog {
  const ref = meal.free ? logDone(meal, freeKcal) : mealMacros(meal);
  const k = ref.kcal > 0 ? kcal / ref.kcal : 0;
  const fallback = { p: (kcal * 0.2) / 4, c: (kcal * 0.5) / 4, f: (kcal * 0.3) / 9 };
  return {
    status: 'other',
    kcal,
    p: ref.kcal > 0 ? ref.p * k : fallback.p,
    c: ref.kcal > 0 ? ref.c * k : fallback.c,
    f: ref.kcal > 0 ? ref.f * k : fallback.f,
  };
}

export function sumLogs(log: DayLog | undefined): MacroTarget {
  return Object.values(log ?? {}).reduce<MacroTarget>(
    (a, l) => (l ? { kcal: a.kcal + l.kcal, p: a.p + l.p, c: a.c + l.c, f: a.f + l.f } : a),
    { ...ZERO },
  );
}

/**
 * Giorno "effettivo": i pasti registrati restano come sono stati mangiati,
 * quelli ancora da fare vengono ri-ottimizzati sul target rimanente.
 */
export function effectiveDay(day: DayPlan, log: DayLog | undefined, target: MacroTarget): DayPlan {
  const keys = Object.keys(log ?? {});
  if (!log || keys.length === 0) return day;

  const shown: DayPlan = {
    meals: day.meals.map((m) => {
      const l = log[m.key];
      if (l?.status === 'done' && l.items) return { ...m, items: l.items };
      return m;
    }),
  };
  // tutti "come previsto": niente da ribilanciare
  if (Object.values(log).every((l) => l?.status === 'done')) return shown;

  const eaten = sumLogs(log);
  const remaining: MacroTarget = {
    kcal: target.kcal - eaten.kcal,
    p: target.p - eaten.p,
    c: target.c - eaten.c,
    f: target.f - eaten.f,
  };
  // il pasto libero non fa parte del target pianificato: se registrato, non va sottratto
  const free = day.meals.find((m) => m.free);
  const freeLog = free ? log[free.key] : undefined;
  if (freeLog) {
    remaining.kcal += freeLog.kcal;
    remaining.p += freeLog.p;
    remaining.c += freeLog.c;
    remaining.f += freeLog.f;
  }
  const locked = new Set<string>(keys);
  const pending = day.meals.filter((m) => !m.free && !locked.has(m.key));
  if (pending.length === 0) return shown;
  return optimizeDay(shown, remaining, locked);
}

export type DayStatus = 'ok' | 'partial' | 'off' | 'none' | 'future';

/** Valuta un giorno del diario rispetto al target (pasto libero escluso dal confronto). */
export function dayStatus(plan: WeekPlan, targets: Targets, foodLog: FoodLog, date: Date): { status: DayStatus; eaten: MacroTarget } {
  const iso = isoDate(date);
  if (iso > isoDate()) return { status: 'future', eaten: ZERO };
  const d = todayIndex(date);
  const log = foodLog[iso];
  const day = plan.days[d];
  const planned = day.meals.filter((m) => !m.free).map((m) => m.key);
  const logged = planned.filter((k) => log?.[k]);
  if (!log || Object.keys(log).length === 0) return { status: 'none', eaten: ZERO };
  const eaten = sumLogs(Object.fromEntries(Object.entries(log).filter(([k]) => planned.includes(k as never))));
  if (logged.length < planned.length) return { status: 'partial', eaten };
  const t = targets.perDay[d];
  const ok = Math.abs(eaten.kcal - t.kcal) <= t.kcal * 0.1 && eaten.p >= t.p * 0.9;
  return { status: ok ? 'ok' : 'off', eaten };
}

/** Ultimi 7 giorni (oggi incluso) per il riquadro aderenza. */
export function lastWeek(plan: WeekPlan, targets: Targets, foodLog: FoodLog) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    out.push({ date, ...dayStatus(plan, targets, foodLog, date) });
  }
  return out;
}


/** Totale del giorno = quanto registrato (pasti pianificati) + pasti ancora da fare. Pasto libero escluso. */
export function dayTotals(day: DayPlan, log: DayLog | undefined): MacroTarget {
  return day.meals.reduce<MacroTarget>((a, m) => {
    if (m.free) return a;
    const l = log?.[m.key];
    const x = l ?? mealMacros(m);
    return { kcal: a.kcal + x.kcal, p: a.p + x.p, c: a.c + x.c, f: a.f + x.f };
  }, { ...ZERO });
}
