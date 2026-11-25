import { describe, expect, it } from 'vitest';
import { getFood } from '../src/lib/foods';
import { fmtQty, halves } from '../src/lib/format';
import { calcTargets } from '../src/lib/nutrition';
import { dayItems, generateWeek, migratePlan, setQuantity, sumMacros } from '../src/lib/plan';
import { maxRelErr, profile } from './helpers';

describe('misure casalinghe', () => {
  it('mezzi e interi', () => {
    expect(halves(0.5)).toBe('½');
    expect(halves(1)).toBe('1');
    expect(halves(1.5)).toBe('1 e ½');
  });
  it('bicchieri, frutti, vasetti, uova', () => {
    expect(fmtQty('latte-ps', 300)).toBe('1 e ½ bicchieri (300 ml)');
    expect(fmtQty('latte-ps', 200)).toBe('1 bicchiere (200 ml)');
    expect(fmtQty('frutta', 100)).toBe('½ frutto (100 g)');
    expect(fmtQty('yogurt-greco', 170)).toBe('1 vasetto (170 g)');
    expect(fmtQty('uova', 180)).toBe('3 uova (180 g)');
    expect(fmtQty('frutta-secca', 15)).toBe('15 g (≈ ½ manciata)');
    expect(fmtQty('olio', 20)).toBe('20 g (≈ 2 cucchiai)');
    expect(fmtQty('pasta', 80)).toBe('80 g');
  });
  it('il piano usa solo pezzi interi o mezzi', () => {
    for (const it of generateWeek(profile()).days.flatMap(dayItems)) {
      const f = getFood(it.foodId);
      if (!f.piece) continue;
      const n = it.grams / f.piece.grams;
      const unit = f.piece.half ? 0.5 : 1;
      expect(Math.abs(n / unit - Math.round(n / unit)), `${it.foodId} ${it.grams}`).toBeLessThan(0.01);
    }
  });
});

describe('quantità modificata a mano', () => {
  const p = profile();
  const t = calcTargets(p);
  const w = generateWeek(p);
  const lunch = w.days[0].meals.find((m) => m.key === 'pranzo')!;
  const ci = lunch.items.findIndex((i) => i.cluster === 'carb');

  it('resta fissata e il giorno resta nei macro', () => {
    const before = lunch.items[ci].grams;
    const d = setQuantity(w.days[0], 'pranzo', ci, before + 30, t.perDay[0]);
    const it = d.meals.find((m) => m.key === 'pranzo')!.items[ci];
    expect(it.grams).toBe(before + 30);
    expect(it.locked).toBe(true);
    expect(maxRelErr(sumMacros(dayItems(d)), t.perDay[0])).toBeLessThan(0.1);
  });

  it('torna automatica', () => {
    const d = setQuantity(w.days[0], 'pranzo', ci, 120, t.perDay[0]);
    const back = setQuantity(d, 'pranzo', ci, null, t.perDay[0]);
    expect(back.meals.find((m) => m.key === 'pranzo')!.items[ci].locked).toBeFalsy();
  });

  it('la migrazione mantiene gli alimenti scelti', () => {
    const m = migratePlan({ ...w, version: 2 }, p);
    const ids = (x: typeof w) => x.days.map((d) => d.meals.map((mm) => mm.items.map((i) => i.foodId).join()).join('|'));
    expect(m.version).toBe(3);
    expect(ids(m).length).toBe(ids(w).length);
  });
});
