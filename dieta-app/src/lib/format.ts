import { getFood } from './foods';
import type { MealItem } from './types';

const nf1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });

export function fmt1(n: number): string {
  return nf1.format(n);
}

/** 0,5 → "½", 1 → "1", 1,5 → "1 e ½" */
export function halves(n: number): string {
  const h = Math.round(n * 2) / 2;
  const whole = Math.floor(h);
  const frac = h - whole === 0.5;
  if (whole === 0) return frac ? '½' : '0';
  return frac ? `${whole} e ½` : String(whole);
}

function unitWord(n: number, u: { singular: string; plural: string }): string {
  return Math.round(n * 2) / 2 <= 1 ? u.singular : u.plural;
}

/** Quantità leggibile: "1 e ½ bicchieri (300 ml)", "3 uova (180 g)", "20 g (≈ ½ manciata)". */
export function fmtQty(foodId: string, grams: number): string {
  const f = getFood(foodId);
  const g = Math.round(grams);
  if (f.piece) {
    const n = grams / f.piece.grams;
    const exact = Math.abs(n * 2 - Math.round(n * 2)) < 0.06;
    return `${exact ? '' : '≈ '}${halves(n)} ${unitWord(n, f.piece)} (${g} ${f.unit})`;
  }
  if (f.household) {
    const n = grams / f.household.grams;
    if (n >= 0.25) return `${g} ${f.unit} (≈ ${halves(n)} ${unitWord(n, f.household)})`;
  }
  return `${g} ${f.unit}`;
}

/** Testo compatto: "Pasta 80 g" */
export function itemText(item: MealItem): string {
  return `${getFood(item.foodId).name} ${fmtQty(item.foodId, item.grams)}`;
}

/** Totali per la spesa: pezzi per gli alimenti "interi" (uova, fette…), altrimenti peso/volume. */
export function fmtTotal(foodId: string, grams: number): string {
  const f = getFood(foodId);
  if (f.piece && !f.piece.half) {
    const n = Math.round(grams / f.piece.grams);
    return `${n} ${n === 1 ? f.piece.singular : f.piece.plural}`;
  }
  const g = Math.round(grams);
  if (g >= 1000) return `${fmt1(g / 1000)} ${f.unit === 'ml' ? 'l' : 'kg'}`;
  return `${g} ${f.unit}`;
}

export function isoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fmtDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', opts);
}
