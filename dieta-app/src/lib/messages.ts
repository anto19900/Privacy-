import { getFood, DEPARTMENTS } from './foods';
import { itemText } from './format';
import { alternativesFor, DAYS } from './plan';
import type { DayPlan, MacroTarget, Meal, Profile } from './types';
import type { ShoppingGroup } from './shopping';

function mealLines(day: DayPlan, meal: Meal, p: Profile, target: MacroTarget): string[] {
  if (meal.free) return ['• Pasto libero 😋 (non cucinare per me!)'];
  const lines = meal.items.map((it) => `• ${itemText(it)}`);
  const ci = meal.items.findIndex((i) => i.cluster === 'carb');
  const carb = meal.items[ci];
  if (carb) {
    const alts = alternativesFor(day, meal.key, ci, p, target).slice(0, 2).map(itemText);
    if (alts.length) lines.push(`   (oppure ${getFood(carb.foodId).name.toLowerCase()} → ${alts.join(' / ')})`);
  }
  return lines;
}

function meal(day: DayPlan, key: Meal['key']): Meal | undefined {
  return day.meals.find((m) => m.key === key);
}

export function dayMessage(day: DayPlan, dayIndex: number, p: Profile, target: MacroTarget, isToday: boolean): string {
  const when = isToday ? 'oggi' : DAYS[dayIndex].toLowerCase();
  const pranzo = meal(day, 'pranzo');
  const cena = meal(day, 'cena');
  const out = [`Ciao Mamma! 👋`, `Ecco il mio menù per ${when}:`, ''];
  if (pranzo) out.push('🍝 *PRANZO*', ...mealLines(day, pranzo, p, target), '');
  if (cena) out.push('🍗 *CENA*', ...mealLines(day, cena, p, target), '');
  out.push('Le grammature sono a crudo. Grazie mille! ❤️');
  return out.join('\n');
}

export function weekMessage(days: DayPlan[]): string {
  const out = ['Ciao Mamma! 👋', 'Ecco pranzi e cene della settimana:', ''];
  days.forEach((day, i) => {
    const pr = meal(day, 'pranzo');
    const ce = meal(day, 'cena');
    out.push(`📅 *${DAYS[i].toUpperCase()}*`);
    if (pr) out.push(`🍝 Pranzo: ${pr.free ? 'pasto libero 😋' : pr.items.map(itemText).join(' + ')}`);
    if (ce) out.push(`🍗 Cena: ${ce.free ? 'pasto libero 😋' : ce.items.map(itemText).join(' + ')}`);
    out.push('');
  });
  out.push('Grammature a crudo. Grazie di tutto! ❤️');
  return out.join('\n');
}

export function shoppingMessage(groups: ShoppingGroup[], extras: { name: string; checked: boolean }[]): string {
  const out = ['🛒 *Lista della spesa*', ''];
  for (const g of groups) {
    const items = g.items.filter((i) => !i.checked);
    if (!items.length) continue;
    const d = DEPARTMENTS[g.department];
    out.push(`${d.emoji} *${d.label}*`);
    items.forEach((i) => out.push(`• ${i.name}: ${i.qty}`));
    out.push('');
  }
  const ex = extras.filter((e) => !e.checked);
  if (ex.length) {
    out.push('➕ *Extra*');
    ex.forEach((e) => out.push(`• ${e.name}`));
  }
  return out.join('\n').trim();
}
