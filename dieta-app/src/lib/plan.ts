import { FOODS, getFood } from './foods';
import type { Cluster, DayPlan, Food, Meal, MealItem, MealKey, Profile, WeekPlan } from './types';

export const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export const MEALS: Record<MealKey, { label: string; emoji: string; share: number }> = {
  colazione: { label: 'Colazione', emoji: '☕', share: 0.2 },
  spuntino: { label: 'Spuntino mattina', emoji: '🍎', share: 0.1 },
  pranzo: { label: 'Pranzo', emoji: '🍝', share: 0.35 },
  merenda: { label: 'Merenda', emoji: '🥛', share: 0.1 },
  cena: { label: 'Cena', emoji: '🍽️', share: 0.25 },
};

export const MEAL_ORDER: MealKey[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'];

export const CLUSTER_LABEL: Record<Cluster, string> = {
  carb: 'Carboidrati',
  protein: 'Proteine',
  veg: 'Verdure',
  fat: 'Grassi',
  colazioneCarb: 'Carboidrati colazione',
  colazioneProt: 'Latte / Yogurt',
  fruit: 'Frutta',
  snack: 'Spuntino',
};

const VEG_GRAMS = 200;

/** Ripartizione delle kcal del pasto (verdure escluse) tra i cluster. */
const TEMPLATES: Record<MealKey, { cluster: Cluster; share: number }[]> = {
  colazione: [
    { cluster: 'colazioneProt', share: 0.45 },
    { cluster: 'colazioneCarb', share: 0.4 },
    { cluster: 'fruit', share: 0.15 },
  ],
  spuntino: [
    { cluster: 'fruit', share: 0.5 },
    { cluster: 'snack', share: 0.5 },
  ],
  pranzo: [
    { cluster: 'carb', share: 0.45 },
    { cluster: 'protein', share: 0.38 },
    { cluster: 'fat', share: 0.17 },
  ],
  merenda: [
    { cluster: 'snack', share: 0.6 },
    { cluster: 'fruit', share: 0.4 },
  ],
  cena: [
    { cluster: 'protein', share: 0.5 },
    { cluster: 'carb', share: 0.32 },
    { cluster: 'fat', share: 0.18 },
  ],
};

/** Rotazioni preferite per dare varietà alla settimana (filtrate poi per preferenze). */
const ROTATIONS: Partial<Record<Cluster, string[]>> = {
  carb: ['pasta', 'riso', 'patate', 'pasta-integrale', 'pane-integrale', 'farro', 'quinoa', 'cous-cous'],
  protein: ['pollo', 'pesce-bianco', 'legumi', 'uova', 'tacchino', 'salmone', 'fiocchi-latte', 'manzo', 'tonno', 'bresaola', 'tofu', 'mozzarella-light'],
  colazioneCarb: ['avena', 'fette-biscottate', 'pane-integrale', 'gallette'],
  colazioneProt: ['yogurt-greco', 'latte-ps', 'skyr', 'yogurt-greco-zl', 'latte-zl', 'yogurt-soia', 'bevanda-soia'],
  fruit: ['frutta', 'banana', 'mela', 'frutti-bosco'],
  snack: ['frutta-secca', 'yogurt-greco', 'skyr', 'yogurt-greco-zl', 'yogurt-soia', 'gallette', 'cioccolato'],
  fat: ['olio'],
  veg: ['verdure', 'insalata', 'zucchine', 'broccoli', 'spinaci', 'pomodori'],
};

export function isAllowed(food: Food, p: Profile): boolean {
  if (p.excludedFoods.includes(food.id)) return false;
  if (p.lactoseFree && food.tags.includes('lactose')) return false;
  if (p.glutenFree && food.tags.includes('gluten')) return false;
  if (p.diet === 'pescetariano' && food.tags.includes('meat')) return false;
  if (p.diet === 'vegetariano' && (food.tags.includes('meat') || food.tags.includes('fish'))) return false;
  if (
    p.diet === 'vegano' &&
    (food.tags.includes('meat') || food.tags.includes('fish') || food.tags.includes('egg') || food.tags.includes('dairy'))
  )
    return false;
  return true;
}

export function allowedInCluster(cluster: Cluster, p: Profile): Food[] {
  const rotation = ROTATIONS[cluster] ?? [];
  const list = FOODS.filter((f) => f.clusters.includes(cluster) && isAllowed(f, p));
  // ordina seguendo la rotazione preferita
  return list.sort((a, b) => idx(rotation, a.id) - idx(rotation, b.id));
}

function idx(arr: string[], id: string): number {
  const i = arr.indexOf(id);
  return i === -1 ? 999 : i;
}

export function roundGrams(food: Food, grams: number): number {
  const g = Math.round(grams / food.step) * food.step;
  return Math.min(food.max, Math.max(food.min, g));
}

export function itemKcal(item: MealItem): number {
  return (getFood(item.foodId).kcal * item.grams) / 100;
}

export function itemMacros(item: MealItem) {
  const f = getFood(item.foodId);
  const k = item.grams / 100;
  return { kcal: f.kcal * k, p: f.p * k, c: f.c * k, f: f.f * k };
}

export function sumMacros(items: MealItem[]) {
  return items.reduce(
    (acc, it) => {
      const m = itemMacros(it);
      return { kcal: acc.kcal + m.kcal, p: acc.p + m.p, c: acc.c + m.c, f: acc.f + m.f };
    },
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

export function dayItems(day: DayPlan): MealItem[] {
  return day.meals.flatMap((m) => m.items);
}

/** Sostituzione isocalorica: stessa energia dell'alimento di partenza. */
export function swapItem(item: MealItem, newFoodId: string): MealItem {
  const newFood = getFood(newFoodId);
  if (item.cluster === 'veg') return { foodId: newFoodId, grams: roundGrams(newFood, item.grams), cluster: item.cluster };
  const kcal = itemKcal(item);
  return { foodId: newFoodId, grams: roundGrams(newFood, (kcal / newFood.kcal) * 100), cluster: item.cluster };
}

/** Alternative dello stesso cluster con grammature già ricalcolate. */
export function alternativesFor(item: MealItem, p: Profile): MealItem[] {
  return allowedInCluster(item.cluster, p)
    .filter((f) => f.id !== item.foodId)
    .map((f) => swapItem(item, f.id));
}

/** Quanti alimenti per cluster usa il generatore (per una spesa compatta). */
const POOL_SIZE: Record<Cluster, number> = {
  carb: 5, protein: 6, veg: 4, fat: 1, colazioneCarb: 2, colazioneProt: 2, fruit: 3, snack: 2,
};

function generatorPool(cluster: Cluster, p: Profile): Food[] {
  const all = allowedInCluster(cluster, p);
  const main = all.filter((f) => !f.fallback);
  const base = main.length >= Math.min(2, all.length) ? main : all;
  const pool = base.slice(0, POOL_SIZE[cluster]);
  return pool.length ? pool : all;
}

function pick(list: Food[], offset: number, avoid: string[] = []): Food | undefined {
  if (list.length === 0) return undefined;
  for (let i = 0; i < list.length; i++) {
    const f = list[(offset + i) % list.length];
    if (!avoid.includes(f.id)) return f;
  }
  return list[offset % list.length];
}

function buildMeal(key: MealKey, mealKcal: number, dayIndex: number, p: Profile, avoid: string[]): Meal {
  const items: MealItem[] = [];
  let budget = mealKcal;

  if (key === 'pranzo' || key === 'cena') {
    const vegList = generatorPool('veg', p);
    const veg = pick(vegList, dayIndex + (key === 'cena' ? 3 : 0));
    if (veg) {
      const it: MealItem = { foodId: veg.id, grams: VEG_GRAMS, cluster: 'veg' };
      items.push(it);
      budget -= itemKcal(it);
    }
  }

  const slotOffsets: Record<MealKey, number> = { colazione: 0, spuntino: 1, pranzo: 0, merenda: 3, cena: 4 };

  for (const slot of TEMPLATES[key]) {
    const list = generatorPool(slot.cluster, p);
    let offset = dayIndex + slotOffsets[key];
    // a cena variamo la fonte proteica rispetto al pranzo
    if (slot.cluster === 'protein' && key === 'cena') offset = dayIndex * 2 + 1;
    if (slot.cluster === 'protein' && key === 'pranzo') offset = dayIndex * 2;
    if (slot.cluster === 'carb' && key === 'cena') offset = dayIndex + 4;
    if (slot.cluster === 'fat') offset = 0;
    const food = pick(list, offset, avoid);
    if (!food) continue;
    const grams = roundGrams(food, ((budget * slot.share) / food.kcal) * 100);
    items.push({ foodId: food.id, grams, cluster: slot.cluster });
  }
  return { key, items };
}

/**
 * Le grammature minime possono far sforare il target: corregge lo scarto
 * agendo sui carboidrati di pranzo e cena (le voci più "elastiche").
 */
function balanceDay(meals: Meal[], target: number): void {
  for (let pass = 0; pass < 2; pass++) {
    const diff = sumMacros(meals.flatMap((m) => m.items)).kcal - target;
    if (Math.abs(diff) < target * 0.02) return;
    const carbs = meals
      .filter((m) => m.key === 'pranzo' || m.key === 'cena')
      .flatMap((m) => m.items.filter((i) => i.cluster === 'carb'));
    if (!carbs.length) return;
    const per = diff / carbs.length;
    for (const it of carbs) {
      const f = getFood(it.foodId);
      it.grams = roundGrams(f, it.grams - (per / f.kcal) * 100);
    }
  }
}

export function generateWeek(p: Profile, kcal: number): WeekPlan {
  const days: DayPlan[] = DAYS.map((_, d) => {
    const meals: Meal[] = [];
    const used: string[] = [];
    for (const key of MEAL_ORDER) {
      const meal = buildMeal(key, kcal * MEALS[key].share, d, p, used);
      meal.items.forEach((i) => {
        if (i.cluster === 'protein' || i.cluster === 'snack') used.push(i.foodId);
      });
      meals.push(meal);
    }
    balanceDay(meals, kcal);
    return { meals };
  });
  return { createdAt: new Date().toISOString(), kcalTarget: kcal, days };
}

/** Indice del giorno corrente con Lunedì = 0. */
export function todayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}
