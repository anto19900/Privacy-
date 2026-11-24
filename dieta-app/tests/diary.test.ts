import { describe, expect, it } from 'vitest';
import { estimateAdaptive, movingAverage } from '../src/lib/adaptive';
import { dayTotals, effectiveDay, logDone, logOther, logSkipped } from '../src/lib/diary';
import { buildForecast } from '../src/lib/forecast';
import { isoDate } from '../src/lib/format';
import { calcTargets } from '../src/lib/nutrition';
import { generateWeek, sumMacros } from '../src/lib/plan';
import { buildShopping } from '../src/lib/shopping';
import { progressCsv } from '../src/lib/backup';
import { maxRelErr, profile } from './helpers';

const p = profile();
const t = calcTargets(p);
const w = generateWeek(p);
const day = w.days[0];
const target = t.perDay[0];

describe('diario e ribilanciamento', () => {
  it('colazione doppia: il resto del giorno compensa', () => {
    const col = day.meals[0];
    const log = { colazione: logOther(col, sumMacros(col.items).kcal * 2) };
    const tot = dayTotals(effectiveDay(day, log, target), log);
    expect(Math.abs(tot.kcal - target.kcal) / target.kcal).toBeLessThan(0.05);
    expect(maxRelErr(tot, target)).toBeLessThan(0.12);
  });
  it('spuntino saltato: i pasti dopo aumentano', () => {
    const log = { colazione: logDone(day.meals[0]), spuntino: logSkipped() };
    const eff = effectiveDay(day, log, target);
    const lunch = (d: typeof day) => sumMacros(d.meals[2].items).kcal;
    expect(lunch(eff)).toBeGreaterThan(lunch(day));
    expect(Math.abs(dayTotals(eff, log).kcal - target.kcal) / target.kcal).toBeLessThan(0.05);
  });
  it('tutto come previsto: nessuna modifica', () => {
    expect(effectiveDay(day, { colazione: logDone(day.meals[0]) }, target).meals[2]).toEqual(day.meals[2]);
  });
});

describe('peso: media mobile, TDEE reale, previsione', () => {
  const weights = Array.from({ length: 8 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (21 - k * 3));
    return { date: isoDate(d), kg: Math.round((80 - (k * 3 * 0.25) / 7) * 10) / 10 };
  });
  it('media mobile su 7 giorni', () => {
    const ma = movingAverage(weights);
    expect(ma).toHaveLength(weights.length);
    expect(ma[ma.length - 1].avg).toBeLessThan(ma[0].avg);
  });
  it('calo più lento del previsto → suggerisce meno calorie', () => {
    const e = estimateAdaptive(weights, {}, w, t, p)!;
    expect(e).not.toBeNull();
    expect(e.observedWeeklyKg).toBeCloseTo(-0.25, 1);
    expect(e.realTdee).toBeLessThan(t.tdee);
    expect(e.delta).toBeLessThan(-100);
  });
  it('servono almeno 14 giorni', () => {
    expect(estimateAdaptive(weights.slice(-3), {}, w, t, p)).toBeNull();
  });
  it('previsione fino al peso obiettivo', () => {
    const f = buildForecast([{ date: isoDate(), kg: 80 }], 80, 72, -0.5);
    expect(f.weeks).toBe(16);
    expect(f.points[f.points.length - 1].kg).toBeCloseTo(72, 1);
  });
});

describe('spesa e export', () => {
  it('arrotonda alle confezioni e rispetta la dispensa', () => {
    const { groups, pantryRows } = buildShopping(w, {}, 'week', { olio: true });
    const rows = groups.flatMap((g) => g.items);
    expect(rows.find((r) => r.foodId === 'olio')).toBeUndefined();
    expect(pantryRows.find((r) => r.foodId === 'olio')).toBeDefined();
    const pasta = rows.find((r) => r.foodId === 'pasta');
    if (pasta) expect(pasta.qty).toMatch(/pacco da 500 g/);
  });
  it('spesa divisa: le due metà sommano la settimana', () => {
    const tot = (m: 'week' | 'a' | 'b') => buildShopping(w, {}, m).groups.flatMap((g) => g.items).reduce((s, r) => s + r.grams, 0);
    expect(tot('a') + tot('b')).toBe(tot('week'));
  });
  it('CSV con separatore ; e virgola decimale', () => {
    const csv = progressCsv([{ date: '2026-11-01', kg: 80.5 }], [{ date: '2026-11-01', waist: 90.2 }]);
    expect(csv).toContain('2026-11-01;80,5;90,2');
  });
});
