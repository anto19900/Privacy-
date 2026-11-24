import { getFood } from './foods';
import { MEAL_SHARES } from './nutrition';
import type { DayPlan, MacroTarget } from './types';

/**
 * Ottimizzatore delle grammature di un giorno.
 *
 * Minimizza (minimi quadrati pesati, con vincoli min/max per alimento):
 *  - errore relativo su proteine, carboidrati, grassi e kcal del giorno (peso alto → macro "tassativi")
 *  - scostamento delle kcal di ogni pasto dalla ripartizione standard (peso basso)
 *  - scostamento dalle grammature iniziali (peso minimo, per porzioni realistiche)
 * Prima risolve in continuo (discesa coordinata), poi arrotonda agli step
 * (es. 5 g, 1 uovo) con una ricerca locale che sceglie l'arrotondamento migliore.
 * Le verdure sono fisse e conteggiate nei macro.
 */

interface Var {
  meal: number;
  item: number;
  coef: { kcal: number; p: number; c: number; f: number };
  min: number;
  max: number;
  step: number;
}

interface Row {
  a: Float64Array;
  b: number;
  w: number;
}

const W = { p: 12, c: 8, f: 10, kcal: 10, meal: 0.35, reg: 0.02 };

export function optimizeDay(day: DayPlan, target: MacroTarget): DayPlan {
  const meals = day.meals.map((m) => ({ ...m, items: m.items.map((i) => ({ ...i })) }));
  const vars: Var[] = [];
  const g0: number[] = [];
  const fixed = { kcal: 0, p: 0, c: 0, f: 0 };
  const fixedMeal = meals.map(() => 0);

  meals.forEach((meal, mi) => {
    if (meal.free) return;
    meal.items.forEach((it, ii) => {
      const food = getFood(it.foodId);
      const coef = { kcal: food.kcal / 100, p: food.p / 100, c: food.c / 100, f: food.f / 100 };
      if (it.cluster === 'veg') {
        fixed.kcal += coef.kcal * it.grams;
        fixed.p += coef.p * it.grams;
        fixed.c += coef.c * it.grams;
        fixed.f += coef.f * it.grams;
        fixedMeal[mi] += coef.kcal * it.grams;
        return;
      }
      // voci facoltative: l'ottimizzatore può azzerarle (e vengono tolte) se servono a restare nei macro
      const optional = it.cluster === 'topping' || (meal.key === 'colazione' && it.cluster === 'fruit');
      vars.push({ meal: mi, item: ii, coef, min: optional ? 0 : food.min, max: food.max, step: food.step });
      g0.push(Math.min(food.max, Math.max(food.min, it.grams || food.min)));
    });
  });
  const n = vars.length;
  if (n === 0) return { meals };

  const rows: Row[] = [];
  const addRow = (fn: (v: Var, i: number) => number, b: number, scale: number, w: number) => {
    const a = new Float64Array(n);
    vars.forEach((v, i) => (a[i] = fn(v, i) / scale));
    rows.push({ a, b: b / scale, w });
  };
  addRow((v) => v.coef.p, target.p - fixed.p, Math.max(target.p, 1), W.p);
  addRow((v) => v.coef.c, target.c - fixed.c, Math.max(target.c, 1), W.c);
  addRow((v) => v.coef.f, target.f - fixed.f, Math.max(target.f, 1), W.f);
  addRow((v) => v.coef.kcal, target.kcal - fixed.kcal, Math.max(target.kcal, 1), W.kcal);

  const active = meals.map((m, i) => ({ m, i })).filter(({ m }) => !m.free && m.items.length);
  const shareSum = active.reduce((s, { m }) => s + MEAL_SHARES[m.key], 0);
  for (const { m, i: mi } of active) {
    const mealKcal = (target.kcal * MEAL_SHARES[m.key]) / shareSum;
    addRow((v) => (v.meal === mi ? v.coef.kcal : 0), mealKcal - fixedMeal[mi], Math.max(mealKcal, 1), W.meal);
  }
  vars.forEach((_, k) => addRow((_v, i) => (i === k ? 1 : 0), g0[k], Math.max(g0[k], 1), W.reg));

  // ---- discesa coordinata con vincoli di box ----
  const g = g0.slice();
  const r = rows.map((row) => row.a.reduce((s, a, i) => s + a * g[i], 0) - row.b);
  const hess = vars.map((_, i) => rows.reduce((s, row) => s + row.w * row.a[i] * row.a[i], 0));

  const move = (i: number, ng: number) => {
    const d = ng - g[i];
    if (d === 0) return;
    rows.forEach((row, k) => (r[k] += row.a[i] * d));
    g[i] = ng;
  };

  for (let sweep = 0; sweep < 400; sweep++) {
    let maxRel = 0;
    for (let i = 0; i < n; i++) {
      let grad = 0;
      rows.forEach((row, k) => (grad += row.w * row.a[i] * r[k]));
      const ng = Math.min(vars[i].max, Math.max(vars[i].min, g[i] - grad / hess[i]));
      maxRel = Math.max(maxRel, Math.abs(ng - g[i]) / vars[i].step);
      move(i, ng);
    }
    if (maxRel < 1e-3) break;
  }

  // ---- arrotondamento agli step + ricerca locale ----
  for (let i = 0; i < n; i++) {
    const v = vars[i];
    move(i, Math.min(v.max, Math.max(v.min, Math.round(g[i] / v.step) * v.step)));
  }
  const delta = (i: number, d: number) =>
    rows.reduce((s, row, k) => {
      const nr = r[k] + row.a[i] * d;
      return s + row.w * (nr * nr - r[k] * r[k]);
    }, 0);

  for (let pass = 0; pass < 80; pass++) {
    let best = { i: -1, ng: 0, gain: -1e-9 };
    for (let i = 0; i < n; i++) {
      const v = vars[i];
      for (const d of [v.step, -v.step, 2 * v.step, -2 * v.step]) {
        const ng = g[i] + d;
        if (ng < v.min - 1e-9 || ng > v.max + 1e-9) continue;
        const dl = delta(i, d);
        if (dl < best.gain) best = { i, ng, gain: dl };
      }
    }
    if (best.i < 0) break;
    move(best.i, best.ng);
  }

  vars.forEach((v, i) => {
    const food = getFood(meals[v.meal].items[v.item].foodId);
    // sotto il minimo "sensato" una voce facoltativa viene tolta
    meals[v.meal].items[v.item].grams = g[i] < food.min ? 0 : Math.round(g[i]);
  });
  return { meals: meals.map((m) => ({ ...m, items: m.items.filter((i) => i.grams > 0) })) };
}
