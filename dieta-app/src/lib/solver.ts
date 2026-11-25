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

/**
 * @param locked pasti già consumati: restano invariati e non partecipano all'ottimizzazione
 *               (il target passato deve essere già al netto di quanto consumato).
 * Le voci facoltative azzerate restano con grams = 0 (gli indici non cambiano);
 * chi salva il piano le filtra con `dropEmpty`.
 */
export function optimizeDay(day: DayPlan, target: MacroTarget, locked: ReadonlySet<string> = new Set()): DayPlan {
  const meals = day.meals.map((m) => ({ ...m, items: m.items.map((i) => ({ ...i })) }));
  const vars: Var[] = [];
  const g0: number[] = [];
  const fixed = { kcal: 0, p: 0, c: 0, f: 0 };
  const fixedMeal = meals.map(() => 0);

  meals.forEach((meal, mi) => {
    if (meal.free || locked.has(meal.key)) return;
    meal.items.forEach((it, ii) => {
      const food = getFood(it.foodId);
      const coef = { kcal: food.kcal / 100, p: food.p / 100, c: food.c / 100, f: food.f / 100 };
      if (it.cluster === 'veg' || it.locked) {
        fixed.kcal += coef.kcal * it.grams;
        fixed.p += coef.p * it.grams;
        fixed.c += coef.c * it.grams;
        fixed.f += coef.f * it.grams;
        fixedMeal[mi] += coef.kcal * it.grams;
        return;
      }
      // voci facoltative: l'ottimizzatore può azzerarle (e vengono tolte) se servono a restare nei macro
      const optional = it.cluster === 'topping' || it.cluster === 'snackCarb' || (meal.key === 'colazione' && it.cluster === 'fruit');
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
  const t = { kcal: Math.max(0, target.kcal), p: Math.max(0, target.p), c: Math.max(0, target.c), f: Math.max(0, target.f) };
  addRow((v) => v.coef.p, t.p - fixed.p, Math.max(t.p, 10), W.p);
  addRow((v) => v.coef.c, t.c - fixed.c, Math.max(t.c, 10), W.c);
  addRow((v) => v.coef.f, t.f - fixed.f, Math.max(t.f, 5), W.f);
  addRow((v) => v.coef.kcal, t.kcal - fixed.kcal, Math.max(t.kcal, 100), W.kcal);

  const active = meals.map((m, i) => ({ m, i })).filter(({ m }) => !m.free && !locked.has(m.key) && m.items.length);
  const shareSum = active.reduce((s, { m }) => s + MEAL_SHARES[m.key], 0);
  for (const { m, i: mi } of active) {
    const mealKcal = (t.kcal * MEAL_SHARES[m.key]) / shareSum;
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

  const fits = (i: number, ng: number) => ng >= vars[i].min - 1e-9 && ng <= vars[i].max + 1e-9;
  const delta2 = (i: number, di: number, j: number, dj: number) =>
    rows.reduce((s, row, k) => {
      const nr = r[k] + row.a[i] * di + row.a[j] * dj;
      return s + row.w * (nr * nr - r[k] * r[k]);
    }, 0);

  for (let pass = 0; pass < 120; pass++) {
    let best = { i: -1, di: 0, j: -1, dj: 0, gain: -1e-9 };
    // mosse singole: ±1 o ±2 unità
    for (let i = 0; i < n; i++) {
      const v = vars[i];
      for (const d of [v.step, -v.step, 2 * v.step, -2 * v.step]) {
        if (!fits(i, g[i] + d)) continue;
        const dl = delta(i, d);
        if (dl < best.gain) best = { i, di: d, j: -1, dj: 0, gain: dl };
      }
    }
    // mosse a coppie (+1 unità a uno, −1 a un altro): utili con unità grossolane (fette, frutti, vasetti)
    if (best.i < 0) {
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          for (const si of [1, -1]) {
            const di = si * vars[i].step;
            const dj = -si * vars[j].step;
            if (!fits(i, g[i] + di) || !fits(j, g[j] + dj)) continue;
            const dl = delta2(i, di, j, dj);
            if (dl < best.gain) best = { i, di, j, dj, gain: dl };
          }
        }
    }
    if (best.i < 0) break;
    move(best.i, g[best.i] + best.di);
    if (best.j >= 0) move(best.j, g[best.j] + best.dj);
  }

  vars.forEach((v, i) => {
    const food = getFood(meals[v.meal].items[v.item].foodId);
    // sotto il minimo "sensato" una voce facoltativa viene tolta
    meals[v.meal].items[v.item].grams = g[i] < food.min ? 0 : Math.round(g[i] * 10) / 10;
  });
  return { meals };
}

export function dropEmpty(day: DayPlan): DayPlan {
  return { meals: day.meals.map((m) => ({ ...m, items: m.items.filter((i) => i.grams > 0) })) };
}
