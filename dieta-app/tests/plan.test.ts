import { describe, expect, it } from 'vitest';
import { calcTargets } from '../src/lib/nutrition';
import { alternativesFor, copyDay, dayItems, generateWeek, isAllowed, repeatMeal, replaceFoodEverywhere, sumMacros, swapInDay } from '../src/lib/plan';
import { getFood } from '../src/lib/foods';
import { maxRelErr, profile } from './helpers';

const CASES = {
  'uomo dimagrimento': {},
  'donna 1250 kcal': { sex: 'F', weightKg: 65, heightCm: 165, goalWeightKg: 58 },
  'minimo 1200 kcal': { sex: 'F', weightKg: 82, heightCm: 160, goalWeightKg: 65, activity: 'sedentario', weeklyRateKg: 1 },
  massa: { activity: 'intenso', goal: 'massa', weightKg: 75, goalWeightKg: 80 },
  mantenimento: { goal: 'mantenimento' },
  vegetariano: { diet: 'vegetariano' },
  'senza lattosio e glutine': { lactoseFree: true, glutenFree: true },
  'allenamento + varietà bassa': { trainingDays: [0, 2, 4], variety: 'bassa' },
} as const;

describe('ottimizzatore: il piano rispetta i macro', () => {
  for (const [name, patch] of Object.entries(CASES)) {
    it(name, () => {
      const p = profile(patch as never);
      const t = calcTargets(p);
      const w = generateWeek(p);
      w.days.forEach((d, i) => {
        const m = sumMacros(dayItems(d));
        expect(maxRelErr(m, t.perDay[i]), `giorno ${i}`).toBeLessThan(0.09);
        expect(Math.abs(m.kcal - t.perDay[i].kcal) / t.perDay[i].kcal, `kcal giorno ${i}`).toBeLessThan(0.05);
      });
    });
  }

  it('rispetta preferenze ed esclusioni', () => {
    const p = profile({ diet: 'vegetariano', lactoseFree: true, excludedFoods: ['uova'] });
    const ids = generateWeek(p).days.flatMap((d) => dayItems(d).map((i) => i.foodId));
    for (const id of ids) expect(isAllowed(getFood(id), p), id).toBe(true);
    expect(ids).not.toContain('uova');
  });

  it('grammature entro i limiti di ogni alimento', () => {
    const w = generateWeek(profile());
    for (const it of w.days.flatMap(dayItems)) {
      const f = getFood(it.foodId);
      expect(it.grams).toBeGreaterThanOrEqual(f.min);
      expect(it.grams).toBeLessThanOrEqual(f.max);
    }
  });

  it('pasto libero nel giorno scelto', () => {
    const w = generateWeek(profile({ freeMeal: { enabled: true, day: 2, meal: 'pranzo', kcal: 600 } }));
    expect(w.days[2].meals.find((m) => m.key === 'pranzo')!.free).toBe(true);
  });
});

describe('cambi e ripetizioni', () => {
  const p = profile();
  const t = calcTargets(p);
  const w = generateWeek(p);

  it('il cambio mantiene i macro del giorno', () => {
    const lunch = w.days[0].meals.find((m) => m.key === 'pranzo')!;
    const ci = lunch.items.findIndex((i) => i.cluster === 'carb');
    const alts = alternativesFor(w.days[0], 'pranzo', ci, p, t.perDay[0]);
    expect(alts.length).toBeGreaterThan(3);
    for (const a of alts.slice(0, 5)) {
      const d = swapInDay(w.days[0], 'pranzo', ci, a.foodId, t.perDay[0]);
      expect(maxRelErr(sumMacros(dayItems(d)), t.perDay[0])).toBeLessThan(0.1);
    }
  });

  it('"mai più" toglie l\'alimento da tutta la settimana', () => {
    const id = w.days[0].meals.find((m) => m.key === 'pranzo')!.items.find((i) => i.cluster === 'protein')!.foodId;
    const p2 = profile({ excludedFoods: [id] });
    const w2 = replaceFoodEverywhere(w, id, p2, calcTargets(p2));
    expect(w2.days.flatMap(dayItems).map((i) => i.foodId)).not.toContain(id);
  });

  it('"uguale a ieri" copia gli alimenti', () => {
    const d = copyDay(w.days[0], w.days[1], t.perDay[1]);
    const ids = (x: typeof d) => x.meals.filter((m) => !m.free).map((m) => m.items.map((i) => i.foodId).join());
    expect(ids(d)).toEqual(ids(w.days[0]).map((s, i) => (w.days[1].meals[i].free ? undefined : s)).filter((x) => x !== undefined));
  });

  it('stessa colazione tutta la settimana', () => {
    const r = repeatMeal(w, 0, 'colazione', t);
    const foods = r.days.map((d) => d.meals[0].items.map((i) => i.foodId).sort().join());
    expect(new Set(foods).size).toBe(1);
  });

  it('i preferiti compaiono più spesso', () => {
    const count = (pp: ReturnType<typeof profile>) => generateWeek(pp).days.flatMap(dayItems).filter((i) => i.foodId === 'salmone').length;
    expect(count(profile({ favoriteFoods: ['salmone'] }))).toBeGreaterThan(count(profile()));
  });
});
