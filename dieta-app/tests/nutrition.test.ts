import { describe, expect, it } from 'vitest';
import { calcBmr, calcTargets, KCAL_PER_KG, MEAL_SHARES } from '../src/lib/nutrition';
import { profile } from './helpers';

describe('BMR e fabbisogno', () => {
  it('Mifflin-St Jeor uomo: 10·80 + 6,25·178 − 5·33 + 5', () => {
    expect(calcBmr({ sex: 'M', weightKg: 80, heightCm: 178, age: 33 })).toBeCloseTo(1752.5, 5);
  });
  it('Mifflin-St Jeor donna: −161', () => {
    expect(calcBmr({ sex: 'F', weightKg: 60, heightCm: 165, age: 30 })).toBeCloseTo(600 + 1031.25 - 150 - 161, 5);
  });
  it('deficit = kg/settimana × 7700 / 7', () => {
    const t = calcTargets(profile({ weeklyRateKg: 0.5, freeMeal: { enabled: false, day: 5, meal: 'cena', kcal: 900 } }));
    expect(t.tdee - t.kcal).toBeGreaterThan(550 - 15);
    expect(t.tdee - t.kcal).toBeLessThan(550 + 15);
    expect(t.weeklyChangeKg).toBeCloseTo(-0.5, 1);
  });
  it('mai sotto il minimo di sicurezza', () => {
    const t = calcTargets(profile({ sex: 'F', weightKg: 55, heightCm: 155, goalWeightKg: 50, activity: 'sedentario', weeklyRateKg: 1.5 }));
    expect(t.kcal).toBe(1200);
    expect(t.floorApplied).toBe(true);
  });
  it('macro coerenti con le calorie e carboidrati mai a zero', () => {
    for (const w of [55, 80, 120]) {
      const t = calcTargets(profile({ weightKg: w, goalWeightKg: w - 10 }));
      expect(Math.abs(t.proteinG * 4 + t.carbsG * 4 + t.fatG * 9 - t.kcal)).toBeLessThan(15);
      expect(t.carbsG).toBeGreaterThan(50);
      expect(t.proteinG * 4).toBeLessThanOrEqual(t.kcal * 0.35 + 4);
    }
  });
  it('correzione kcal (TDEE reale) applicata', () => {
    expect(calcTargets(profile({ kcalAdjust: -200 })).kcal).toBe(calcTargets(profile()).kcal - 200);
  });
});

describe('pasto libero', () => {
  it('la settimana resta a 7 × target', () => {
    const t = calcTargets(profile({ freeMeal: { enabled: true, day: 5, meal: 'cena', kcal: 900 } }));
    const week = t.perDay.reduce((s, d) => s + d.kcal, 0) + t.freeMeal!.kcal;
    expect(Math.abs(week - 7 * t.kcal)).toBeLessThan(30);
  });
  it('proteine invariate nei giorni normali', () => {
    const t = calcTargets(profile());
    expect(t.perDay[0].p).toBe(t.proteinG);
    expect(t.perDay[5].p).toBeCloseTo(t.proteinG * (1 - MEAL_SHARES.cena), -1);
  });
});

describe('giorni di allenamento', () => {
  it('più carboidrati in allenamento, media settimanale invariata', () => {
    const base = calcTargets(profile());
    const t = calcTargets(profile({ trainingDays: [0, 2, 4] }));
    expect(t.perDay[0].c).toBeGreaterThan(base.perDay[0].c);
    expect(t.perDay[1].c).toBeLessThan(base.perDay[1].c);
    const sum = (x: typeof t) => x.perDay.reduce((s, d) => s + d.c, 0);
    expect(Math.abs(sum(t) - sum(base))).toBeLessThanOrEqual(7);
    expect(t.perDay.map((d) => d.p)).toEqual(base.perDay.map((d) => d.p));
  });
  void KCAL_PER_KG;
});
