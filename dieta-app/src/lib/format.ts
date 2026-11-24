import { getFood } from './foods';
import type { MealItem } from './types';

const nf1 = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });

export function fmt1(n: number): string {
  return nf1.format(n);
}

export function fmtQty(foodId: string, grams: number): string {
  const f = getFood(foodId);
  if (f.piece) {
    const n = Math.round(grams / f.piece.grams);
    return `${n} ${n === 1 ? f.piece.singular : f.piece.plural}`;
  }
  if (f.id === 'olio') {
    const tbsp = grams / 10;
    const t = tbsp === 1 ? '1 cucchiaio' : `${fmt1(tbsp)} cucchiai`;
    return `${grams}g (${t})`;
  }
  return `${grams}${f.unit}`;
}

/** Testo compatto: "Pasta 80g" */
export function itemText(item: MealItem): string {
  const f = getFood(item.foodId);
  const q = fmtQty(item.foodId, item.grams);
  if (f.piece) return `${f.name} (${q})`;
  return `${f.name} ${q}`;
}

export function fmtTotal(foodId: string, grams: number): string {
  const f = getFood(foodId);
  if (f.piece) {
    const n = Math.round(grams / f.piece.grams);
    return `${n} ${n === 1 ? f.piece.singular : f.piece.plural}`;
  }
  if (grams >= 1000) return `${fmt1(grams / 1000)} ${f.unit === 'ml' ? 'l' : 'kg'}`;
  return `${grams} ${f.unit}`;
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
