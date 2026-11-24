import { DEPARTMENTS, getFood } from './foods';
import { fmt1, fmtTotal } from './format';
import type { Department, WeekPlan } from './types';

/** Confezioni tipiche del supermercato (g o ml). */
export const PACKS: Record<string, { size: number; name: string }> = {
  pasta: { size: 500, name: 'pacco da 500 g' },
  'pasta-integrale': { size: 500, name: 'pacco da 500 g' },
  'pasta-legumi': { size: 250, name: 'pacco da 250 g' },
  'pasta-sg': { size: 400, name: 'pacco da 400 g' },
  riso: { size: 1000, name: 'pacco da 1 kg' },
  'riso-integrale': { size: 500, name: 'pacco da 500 g' },
  farro: { size: 500, name: 'pacco da 500 g' },
  orzo: { size: 500, name: 'pacco da 500 g' },
  'grano-saraceno': { size: 500, name: 'pacco da 500 g' },
  'cous-cous': { size: 500, name: 'pacco da 500 g' },
  quinoa: { size: 400, name: 'pacco da 400 g' },
  polenta: { size: 500, name: 'pacco da 500 g' },
  gnocchi: { size: 500, name: 'confezione da 500 g' },
  'pane-integrale': { size: 500, name: 'pagnotta da ~500 g' },
  'pane-segale': { size: 500, name: 'pacco da 500 g' },
  gallette: { size: 130, name: 'pacco da 130 g' },
  crackers: { size: 250, name: 'pacco da 250 g' },
  avena: { size: 500, name: 'pacco da 500 g' },
  'fette-biscottate': { size: 300, name: 'pacco da 300 g' },
  'corn-flakes': { size: 375, name: 'scatola da 375 g' },
  muesli: { size: 375, name: 'scatola da 375 g' },
  'yogurt-greco': { size: 170, name: 'vasetto da 170 g' },
  skyr: { size: 150, name: 'vasetto da 150 g' },
  'yogurt-proteico': { size: 150, name: 'vasetto da 150 g' },
  'yogurt-greco-zl': { size: 150, name: 'vasetto da 150 g' },
  'yogurt-soia': { size: 125, name: 'vasetto da 125 g' },
  'latte-ps': { size: 1000, name: 'brick da 1 l' },
  'latte-zl': { size: 1000, name: 'brick da 1 l' },
  'bevanda-soia': { size: 1000, name: 'brick da 1 l' },
  'proteine-polvere': { size: 1000, name: 'barattolo da 1 kg' },
  'proteine-vegetali': { size: 500, name: 'barattolo da 500 g' },
  tonno: { size: 80, name: 'scatoletta da 80 g' },
  gamberi: { size: 400, name: 'busta surgelata da 400 g' },
  uova: { size: 360, name: 'confezione da 6' },
  albumi: { size: 500, name: 'brick da 500 g' },
  legumi: { size: 240, name: 'barattolo da 240 g (sgocciolato)' },
  'fiocchi-latte': { size: 200, name: 'vaschetta da 200 g' },
  'ricotta-light': { size: 250, name: 'vaschetta da 250 g' },
  'mozzarella-light': { size: 125, name: 'mozzarella da 125 g' },
  bresaola: { size: 100, name: 'vaschetta da 100 g' },
  'fesa-affettato': { size: 100, name: 'vaschetta da 100 g' },
  'crudo-sgrassato': { size: 80, name: 'vaschetta da 80 g' },
  tofu: { size: 200, name: 'panetto da 200 g' },
  tempeh: { size: 200, name: 'panetto da 200 g' },
  seitan: { size: 200, name: 'confezione da 200 g' },
  edamame: { size: 400, name: 'busta surgelata da 400 g' },
  insalata: { size: 125, name: 'busta da 125 g' },
  rucola: { size: 125, name: 'busta da 125 g' },
  spinaci: { size: 300, name: 'busta da 300 g' },
  'frutti-bosco': { size: 250, name: 'vaschetta da 250 g' },
  fragole: { size: 500, name: 'cestino da 500 g' },
  olio: { size: 1000, name: 'bottiglia da 1 l' },
  olive: { size: 300, name: 'vasetto da 300 g' },
  parmigiano: { size: 200, name: 'pezzo da ~200 g' },
  'frutta-secca': { size: 200, name: 'busta da 200 g' },
  'burro-arachidi': { size: 350, name: 'vasetto da 350 g' },
  semi: { size: 250, name: 'busta da 250 g' },
  cioccolato: { size: 100, name: 'tavoletta da 100 g' },
};

/** Arrotondamento per gli alimenti sfusi (banco, ortofrutta). */
function looseStep(dep: Department): number {
  return dep === 'macelleria' ? 50 : 100;
}

export interface ShoppingRow {
  foodId: string;
  key: string; // chiave per la spunta (dipende dalla modalità)
  name: string;
  emoji: string;
  grams: number;
  qty: string; // cosa comprare (confezioni o peso arrotondato)
  need: string; // quantità esatta del piano
  checked: boolean;
}

export interface ShoppingGroup {
  department: Department;
  items: ShoppingRow[];
}

export type ShopMode = 'week' | 'a' | 'b';
export const SPLIT_DAYS: Record<ShopMode, number[]> = { week: [0, 1, 2, 3, 4, 5, 6], a: [0, 1, 2, 3], b: [4, 5, 6] };
export const SPLIT_LABEL: Record<ShopMode, string> = { week: 'Settimana', a: 'Spesa 1 · Lun–Gio', b: 'Spesa 2 · Ven–Dom' };

export function checkKey(mode: ShopMode, foodId: string): string {
  return mode === 'week' ? foodId : `${mode}:${foodId}`;
}

function buyQty(foodId: string, grams: number): string {
  const f = getFood(foodId);
  const pack = PACKS[foodId];
  if (pack) {
    const n = Math.ceil(grams / pack.size - 0.05); // tolleranza: 510 g → 1 pacco da 500 g
    const count = Math.max(1, n);
    return `${count} × ${pack.name}`;
  }
  if (f.piece) return fmtTotal(foodId, grams);
  const step = looseStep(f.department);
  const g = Math.ceil(grams / step) * step;
  return g >= 1000 ? `${fmt1(g / 1000)} ${f.unit === 'ml' ? 'l' : 'kg'}` : `${g} ${f.unit}`;
}

export function buildShopping(
  plan: WeekPlan,
  checked: Record<string, boolean>,
  mode: ShopMode = 'week',
  pantry: Record<string, boolean> = {},
): { groups: ShoppingGroup[]; pantryRows: ShoppingRow[] } {
  const totals = new Map<string, number>();
  for (const di of SPLIT_DAYS[mode])
    for (const meal of plan.days[di].meals) for (const it of meal.items) totals.set(it.foodId, (totals.get(it.foodId) ?? 0) + it.grams);

  const groups = new Map<Department, ShoppingRow[]>();
  const pantryRows: ShoppingRow[] = [];
  for (const [foodId, grams] of totals) {
    if (grams <= 0) continue;
    const f = getFood(foodId);
    const key = checkKey(mode, foodId);
    const row: ShoppingRow = { foodId, key, name: f.name, emoji: f.emoji, grams, qty: buyQty(foodId, grams), need: fmtTotal(foodId, grams), checked: !!checked[key] };
    if (pantry[foodId]) {
      pantryRows.push(row);
      continue;
    }
    const list = groups.get(f.department) ?? [];
    list.push(row);
    groups.set(f.department, list);
  }
  return {
    groups: [...groups.entries()]
      .sort((a, b) => DEPARTMENTS[a[0]].order - DEPARTMENTS[b[0]].order)
      .map(([department, items]) => ({ department, items: items.sort((a, b) => a.name.localeCompare(b.name, 'it')) })),
    pantryRows: pantryRows.sort((a, b) => a.name.localeCompare(b.name, 'it')),
  };
}
