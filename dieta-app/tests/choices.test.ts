import { describe, expect, it } from 'vitest';
import { calcTargets } from '../src/lib/nutrition';
import { addItem, allowedInCluster, alternativesFor, dayItems, generateWeek, removeItem, sumMacros } from '../src/lib/plan';
import { maxRelErr, profile } from './helpers';

const p = profile();
const t = calcTargets(p);
const w = generateWeek(p);
const day = w.days[0];

describe('più scelte nelle sostituzioni', () => {
  it('formaggio fresco a colazione', () => {
    const ids = allowedInCluster('colazioneProt', p).map((f) => f.id);
    for (const id of ['formaggio-spalmabile', 'ricotta-light', 'fiocchi-latte', 'quark', 'uova', 'bresaola']) expect(ids).toContain(id);
  });
  it('marmellata e miele tra i topping', () => {
    const ids = allowedInCluster('topping', p).map((f) => f.id);
    for (const id of ['marmellata', 'marmellata-light', 'miele', 'frutta-secca']) expect(ids).toContain(id);
  });
  it('frutta secca e barretta a merenda', () => {
    const ids = allowedInCluster('snack', p).map((f) => f.id);
    for (const id of ['frutta-secca', 'barretta-proteica', 'hummus', 'yogurt-greco']) expect(ids).toContain(id);
  });
  it('preferenze rispettate (vegano: niente crema alle nocciole né barretta)', () => {
    const v = profile({ diet: 'vegano' });
    expect(allowedInCluster('topping', v).map((f) => f.id)).not.toContain('crema-nocciole');
    expect(allowedInCluster('snack', v).map((f) => f.id)).not.toContain('barretta-proteica');
  });
  it('la frutta secca a merenda mantiene i macro', () => {
    const merenda = day.meals.find((m) => m.key === 'merenda')!;
    const si = merenda.items.findIndex((i) => i.cluster === 'snack');
    const alt = alternativesFor(day, 'merenda', si, p, t.perDay[0]).find((a) => a.foodId === 'frutta-secca');
    expect(alt).toBeDefined();
    expect(alt!.grams).toBeGreaterThan(0);
  });
});

describe('aggiungi / togli alimento', () => {
  it('aggiunge la marmellata a colazione e resta nei macro', () => {
    const d = addItem(day, 'colazione', 'marmellata', 'topping', t.perDay[0]);
    const col = d.meals.find((m) => m.key === 'colazione')!;
    const jam = col.items.find((i) => i.foodId === 'marmellata');
    expect(jam?.grams).toBe(10); // 1 cucchiaino
    expect(maxRelErr(sumMacros(dayItems(d)), t.perDay[0])).toBeLessThan(0.1);
  });
  it('toglie un alimento e ribilancia', () => {
    const col = day.meals.find((m) => m.key === 'colazione')!;
    const d = removeItem(day, 'colazione', col.items.length - 1, t.perDay[0]);
    expect(d.meals.find((m) => m.key === 'colazione')!.items.length).toBe(col.items.length - 1);
    expect(Math.abs(sumMacros(dayItems(d)).kcal - t.perDay[0].kcal) / t.perDay[0].kcal).toBeLessThan(0.06);
  });
});
