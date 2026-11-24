import { FOODS, getFood } from './foods';
import { calcTargets, MEAL_SHARES } from './nutrition';
import { optimizeDay } from './solver';
import type { Cluster, DayPlan, Food, MacroTarget, Meal, MealItem, MealKey, Profile, Targets, WeekPlan } from './types';

export const PLAN_VERSION = 2;

export const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export const MEALS: Record<MealKey, { label: string; emoji: string }> = {
  colazione: { label: 'Colazione', emoji: '☕' },
  spuntino: { label: 'Spuntino mattina', emoji: '🍎' },
  pranzo: { label: 'Pranzo', emoji: '🍝' },
  merenda: { label: 'Merenda', emoji: '🥛' },
  cena: { label: 'Cena', emoji: '🍽️' },
};

export const MEAL_ORDER: MealKey[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena'];

export const CLUSTER_LABEL: Record<Cluster, string> = {
  carb: 'Carboidrati',
  protein: 'Proteine',
  veg: 'Verdure',
  fat: 'Condimento',
  colazioneCarb: 'Carboidrati colazione',
  colazioneProt: 'Latte / Yogurt / Proteine',
  fruit: 'Frutta',
  snack: 'Spuntino proteico',
  snackCarb: 'Pane / Gallette / Crackers',
  topping: 'Frutta secca / Semi',
};

const VEG_GRAMS = 200;

/** Struttura di ogni pasto: cluster + quota iniziale delle kcal del pasto (punto di partenza dell'ottimizzatore). */
const TEMPLATES: Record<MealKey, { cluster: Cluster; share: number }[]> = {
  colazione: [
    { cluster: 'colazioneProt', share: 0.4 },
    { cluster: 'colazioneCarb', share: 0.35 },
    { cluster: 'fruit', share: 0.12 },
    { cluster: 'topping', share: 0.13 },
  ],
  spuntino: [
    { cluster: 'snack', share: 0.55 },
    { cluster: 'fruit', share: 0.45 },
  ],
  pranzo: [
    { cluster: 'carb', share: 0.45 },
    { cluster: 'protein', share: 0.38 },
    { cluster: 'fat', share: 0.17 },
  ],
  merenda: [
    { cluster: 'snack', share: 0.55 },
    { cluster: 'snackCarb', share: 0.45 },
  ],
  cena: [
    { cluster: 'protein', share: 0.5 },
    { cluster: 'carb', share: 0.32 },
    { cluster: 'fat', share: 0.18 },
  ],
};

/** Ordine di preferenza per la rotazione settimanale (filtrato poi per preferenze). */
const ROTATIONS: Partial<Record<Cluster, string[]>> = {
  carb: ['pasta', 'riso', 'patate', 'pane-integrale', 'pasta-integrale', 'farro', 'patate-dolci', 'riso-integrale', 'pasta-legumi', 'orzo', 'quinoa', 'cous-cous', 'grano-saraceno', 'gnocchi', 'polenta', 'pasta-sg', 'pane-segale', 'gallette'],
  protein: ['pollo', 'pesce-bianco', 'uova', 'tacchino', 'legumi', 'salmone', 'manzo', 'tonno', 'albumi', 'gamberi', 'fiocchi-latte', 'vitello', 'bresaola', 'calamari', 'mozzarella-light', 'lonza', 'tofu', 'tempeh', 'seitan', 'edamame', 'ricotta-light', 'crudo-sgrassato', 'fesa-affettato'],
  colazioneCarb: ['avena', 'fette-biscottate', 'pane-integrale', 'muesli', 'corn-flakes', 'gallette', 'pane-segale'],
  colazioneProt: ['yogurt-greco', 'skyr', 'yogurt-proteico', 'latte-ps', 'yogurt-greco-zl', 'latte-zl', 'yogurt-soia', 'bevanda-soia', 'proteine-vegetali', 'proteine-polvere'],
  fruit: ['frutta', 'banana', 'mela', 'kiwi', 'frutti-bosco', 'arancia', 'pera', 'fragole', 'ananas'],
  snack: ['yogurt-greco', 'bresaola', 'skyr', 'fiocchi-latte', 'yogurt-proteico', 'fesa-affettato', 'parmigiano', 'edamame', 'yogurt-greco-zl', 'yogurt-soia', 'proteine-vegetali', 'proteine-polvere'],
  snackCarb: ['gallette', 'pane-integrale', 'crackers', 'fette-biscottate', 'pane-segale'],
  topping: ['frutta-secca', 'burro-arachidi', 'semi', 'cioccolato'],
  fat: ['olio', 'avocado', 'parmigiano', 'olive'],
  veg: ['verdure', 'zucchine', 'insalata', 'broccoli', 'spinaci', 'pomodori', 'fagiolini', 'carote', 'peperoni', 'finocchi', 'melanzane', 'cavolfiore', 'rucola', 'asparagi'],
};

/** Quanti alimenti per cluster usa il generatore in una settimana. */
const POOL_SIZE: Record<Cluster, number> = {
  carb: 8, protein: 10, veg: 9, fat: 1, colazioneCarb: 4, colazioneProt: 3, fruit: 6, snack: 5, snackCarb: 3, topping: 3,
};

export function isAllowed(food: Food, p: Profile): boolean {
  if (p.excludedFoods.includes(food.id)) return false;
  if (p.lactoseFree && food.tags.includes('lactose')) return false;
  if (p.glutenFree && food.tags.includes('gluten')) return false;
  const t = food.tags;
  if (p.diet === 'pescetariano' && t.includes('meat')) return false;
  if (p.diet === 'vegetariano' && (t.includes('meat') || t.includes('fish'))) return false;
  if (p.diet === 'vegano' && (t.includes('meat') || t.includes('fish') || t.includes('egg') || t.includes('dairy'))) return false;
  return true;
}

function idx(arr: string[], id: string): number {
  const i = arr.indexOf(id);
  return i === -1 ? 999 : i;
}

export function allowedInCluster(cluster: Cluster, p: Profile): Food[] {
  const rotation = ROTATIONS[cluster] ?? [];
  return FOODS.filter((f) => f.clusters.includes(cluster) && isAllowed(f, p)).sort((a, b) => idx(rotation, a.id) - idx(rotation, b.id));
}

function generatorPool(cluster: Cluster, p: Profile): Food[] {
  const all = allowedInCluster(cluster, p);
  const main = all.filter((f) => !f.fallback);
  const want = POOL_SIZE[cluster];
  // le varianti "di ripiego" (senza lattosio, soia, proteine in polvere) entrano solo se servono
  const pool = [...main, ...all.filter((f) => f.fallback)].slice(0, Math.max(want, Math.min(2, all.length)));
  return main.length >= Math.min(want, 2) ? main.slice(0, want) : pool;
}

function pick(list: Food[], offset: number, avoid: string[] = []): Food | undefined {
  if (list.length === 0) return undefined;
  for (let i = 0; i < list.length; i++) {
    const f = list[(offset + i) % list.length];
    if (!avoid.includes(f.id)) return f;
  }
  return list[offset % list.length];
}

export function roundGrams(food: Food, grams: number): number {
  const g = Math.round(grams / food.step) * food.step;
  return Math.min(food.max, Math.max(food.min, g));
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

export function dayTarget(targets: Targets, dayIndex: number): MacroTarget {
  return targets.perDay[dayIndex];
}

/** Offset di rotazione: varia gli alimenti tra giorni e tra pasti. */
const OFFSETS: Record<MealKey, Partial<Record<Cluster, (d: number) => number>>> = {
  colazione: { colazioneProt: (d) => d, colazioneCarb: (d) => d, fruit: (d) => d, topping: (d) => d },
  spuntino: { snack: (d) => d, fruit: (d) => d + 2 },
  pranzo: { carb: (d) => d, protein: (d) => d * 2, fat: () => 0 },
  merenda: { snack: (d) => d + 3, snackCarb: (d) => d },
  cena: { protein: (d) => d * 2 + 1, carb: (d) => d + 4, fat: () => 0 },
};

function buildDay(p: Profile, target: MacroTarget, d: number, freeMeal: Targets['freeMeal']): DayPlan {
  const used: string[] = [];
  const shareSum = MEAL_ORDER.filter((k) => !(freeMeal && freeMeal.day === d && freeMeal.meal === k)).reduce((s, k) => s + MEAL_SHARES[k], 0);

  const meals: Meal[] = MEAL_ORDER.map((key) => {
    if (freeMeal && freeMeal.day === d && freeMeal.meal === key) return { key, items: [], free: true };
    const mealKcal = (target.kcal * MEAL_SHARES[key]) / shareSum;
    const items: MealItem[] = [];
    let budget = mealKcal;
    if (key === 'pranzo' || key === 'cena') {
      const veg = pick(generatorPool('veg', p), d * 2 + (key === 'cena' ? 1 : 0));
      if (veg) {
        items.push({ foodId: veg.id, grams: VEG_GRAMS, cluster: 'veg' });
        budget -= (veg.kcal * VEG_GRAMS) / 100;
      }
    }
    for (const slot of TEMPLATES[key]) {
      const off = OFFSETS[key][slot.cluster]?.(d) ?? d;
      const food = pick(generatorPool(slot.cluster, p), off, used);
      if (!food) continue;
      if (['protein', 'snack', 'carb', 'snackCarb', 'fruit'].includes(slot.cluster)) used.push(food.id);
      items.push({ foodId: food.id, grams: roundGrams(food, ((budget * slot.share) / food.kcal) * 100), cluster: slot.cluster });
    }
    return { key, items };
  });
  return optimizeDay({ meals }, target);
}

export function generateWeek(p: Profile): WeekPlan {
  const t = calcTargets(p);
  const days = DAYS.map((_, d) => buildDay(p, t.perDay[d], d, t.freeMeal));
  return { version: PLAN_VERSION, createdAt: new Date().toISOString(), days };
}

/** Sostituisce un alimento e ri-ottimizza il giorno per restare nei macro. */
export function swapInDay(day: DayPlan, mealKey: MealKey, itemIndex: number, foodId: string, target: MacroTarget): DayPlan {
  const meals = day.meals.map((m) =>
    m.key !== mealKey
      ? m
      : {
          ...m,
          items: m.items.map((it, i) => {
            if (i !== itemIndex) return it;
            const nf = getFood(foodId);
            // punto di partenza isocalorico, poi l'ottimizzatore sistema i macro
            const kcal = itemMacros(it).kcal;
            const grams = it.cluster === 'veg' ? it.grams : roundGrams(nf, (kcal / nf.kcal) * 100);
            return { foodId, grams, cluster: it.cluster };
          }),
        },
  );
  return optimizeDay({ meals }, target);
}

/** Alternative dello stesso cluster, con le grammature che avrebbero dopo il ribilanciamento. */
export function alternativesFor(day: DayPlan, mealKey: MealKey, itemIndex: number, p: Profile, target: MacroTarget): MealItem[] {
  const meal = day.meals.find((m) => m.key === mealKey);
  const item = meal?.items[itemIndex];
  if (!item) return [];
  return allowedInCluster(item.cluster, p)
    .filter((f) => f.id !== item.foodId)
    .map((f) => {
      const nd = swapInDay(day, mealKey, itemIndex, f.id, target);
      return nd.meals.find((m) => m.key === mealKey)!.items[itemIndex];
    });
}

/** Indice del giorno corrente con Lunedì = 0. */
export function todayIndex(date = new Date()): number {
  return (date.getDay() + 6) % 7;
}
