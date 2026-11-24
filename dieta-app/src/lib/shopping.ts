import { DEPARTMENTS, getFood } from './foods';
import { fmtTotal } from './format';
import type { Department, WeekPlan } from './types';

export interface ShoppingRow {
  foodId: string;
  name: string;
  emoji: string;
  grams: number;
  qty: string;
  checked: boolean;
}

export interface ShoppingGroup {
  department: Department;
  items: ShoppingRow[];
}

export function buildShopping(plan: WeekPlan, checked: Record<string, boolean>): ShoppingGroup[] {
  const totals = new Map<string, number>();
  for (const day of plan.days)
    for (const meal of day.meals)
      for (const it of meal.items) totals.set(it.foodId, (totals.get(it.foodId) ?? 0) + it.grams);

  const groups = new Map<Department, ShoppingRow[]>();
  for (const [foodId, grams] of totals) {
    const f = getFood(foodId);
    const row: ShoppingRow = { foodId, name: f.name, emoji: f.emoji, grams, qty: fmtTotal(foodId, grams), checked: !!checked[foodId] };
    const list = groups.get(f.department) ?? [];
    list.push(row);
    groups.set(f.department, list);
  }
  return [...groups.entries()]
    .sort((a, b) => DEPARTMENTS[a[0]].order - DEPARTMENTS[b[0]].order)
    .map(([department, items]) => ({ department, items: items.sort((a, b) => a.name.localeCompare(b.name, 'it')) }));
}
