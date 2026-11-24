import type { Food } from './types';

// Valori nutrizionali indicativi per 100 g (o 100 ml), alimenti crudi salvo indicazione.
export const FOODS: Food[] = [
  // ---- Carboidrati (pranzo/cena) ----
  { id: 'pasta', name: 'Pasta', emoji: '🍝', clusters: ['carb'], department: 'dispensa', kcal: 353, p: 12.5, c: 71, f: 1.5, tags: ['gluten'], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'pasta-integrale', name: 'Pasta integrale', emoji: '🍝', clusters: ['carb'], department: 'dispensa', kcal: 340, p: 13, c: 64, f: 2.5, tags: ['gluten'], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'riso', name: 'Riso', emoji: '🍚', clusters: ['carb'], department: 'dispensa', kcal: 350, p: 7, c: 78, f: 0.6, tags: [], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'patate', name: 'Patate', emoji: '🥔', clusters: ['carb'], department: 'ortofrutta', kcal: 77, p: 2, c: 17, f: 0.1, tags: [], unit: 'g', step: 10, min: 150, max: 600 },
  { id: 'pane-integrale', name: 'Pane integrale', emoji: '🍞', clusters: ['carb', 'colazioneCarb'], department: 'dispensa', kcal: 240, p: 9, c: 44, f: 2.5, tags: ['gluten'], unit: 'g', step: 5, min: 30, max: 160 },
  { id: 'farro', name: 'Farro', emoji: '🌾', clusters: ['carb'], department: 'dispensa', kcal: 335, p: 15, c: 67, f: 2.5, tags: ['gluten'], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'cous-cous', name: 'Cous cous', emoji: '🥣', clusters: ['carb'], department: 'dispensa', kcal: 360, p: 12.5, c: 72, f: 1.5, tags: ['gluten'], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'quinoa', name: 'Quinoa', emoji: '🥣', clusters: ['carb'], department: 'dispensa', kcal: 368, p: 14, c: 64, f: 6, tags: [], unit: 'g', step: 5, min: 50, max: 140 },
  { id: 'gallette', name: 'Gallette di riso', emoji: '🍘', clusters: ['carb', 'colazioneCarb', 'snack'], department: 'dispensa', kcal: 380, p: 8, c: 81, f: 3, tags: [], unit: 'g', step: 8, min: 16, max: 120, piece: { grams: 8, singular: 'galletta', plural: 'gallette' } },

  // ---- Colazione: carboidrati ----
  { id: 'avena', name: "Fiocchi d'avena", emoji: '🥣', clusters: ['colazioneCarb'], department: 'dispensa', kcal: 370, p: 13, c: 60, f: 7, tags: ['gluten'], unit: 'g', step: 5, min: 30, max: 120 },
  { id: 'fette-biscottate', name: 'Fette biscottate integrali', emoji: '🍞', clusters: ['colazioneCarb'], department: 'dispensa', kcal: 400, p: 12, c: 70, f: 6, tags: ['gluten'], unit: 'g', step: 10, min: 20, max: 100, piece: { grams: 10, singular: 'fetta biscottata', plural: 'fette biscottate' } },

  // ---- Colazione: proteine / latte ----
  { id: 'yogurt-greco', name: 'Yogurt greco 0%', emoji: '🥛', clusters: ['colazioneProt', 'snack'], department: 'latticini', kcal: 57, p: 10, c: 4, f: 0.2, tags: ['lactose', 'dairy'], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'skyr', name: 'Skyr', emoji: '🥛', clusters: ['colazioneProt', 'snack'], department: 'latticini', kcal: 63, p: 11, c: 4, f: 0.2, tags: ['lactose', 'dairy'], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'latte-ps', name: 'Latte parz. scremato', emoji: '🥛', clusters: ['colazioneProt'], department: 'latticini', kcal: 46, p: 3.3, c: 5, f: 1.6, tags: ['lactose', 'dairy'], unit: 'ml', step: 10, min: 100, max: 500 },
  { id: 'latte-zl', name: 'Latte senza lattosio', emoji: '🥛', clusters: ['colazioneProt'], department: 'latticini', kcal: 46, p: 3.3, c: 5, f: 1.6, tags: ['dairy'], unit: 'ml', step: 10, min: 100, max: 500, fallback: true },
  { id: 'yogurt-greco-zl', name: 'Yogurt greco senza lattosio', emoji: '🥛', clusters: ['colazioneProt', 'snack'], department: 'latticini', kcal: 60, p: 10, c: 4, f: 0.5, tags: ['dairy'], unit: 'g', step: 10, min: 100, max: 400, fallback: true },
  { id: 'bevanda-soia', name: 'Bevanda di soia', emoji: '🌱', clusters: ['colazioneProt'], department: 'latticini', kcal: 33, p: 3.3, c: 0.7, f: 1.8, tags: [], unit: 'ml', step: 10, min: 100, max: 500, fallback: true },
  { id: 'yogurt-soia', name: 'Yogurt di soia', emoji: '🌱', clusters: ['colazioneProt', 'snack'], department: 'latticini', kcal: 50, p: 4, c: 2, f: 2.3, tags: [], unit: 'g', step: 10, min: 100, max: 400, fallback: true },

  // ---- Proteine (pranzo/cena) ----
  { id: 'pollo', name: 'Petto di pollo', emoji: '🍗', clusters: ['protein'], department: 'macelleria', kcal: 110, p: 23, c: 0, f: 1.5, tags: ['meat'], unit: 'g', step: 10, min: 80, max: 300 },
  { id: 'tacchino', name: 'Fesa di tacchino', emoji: '🦃', clusters: ['protein'], department: 'macelleria', kcal: 107, p: 24, c: 0, f: 1, tags: ['meat'], unit: 'g', step: 10, min: 80, max: 300 },
  { id: 'manzo', name: 'Manzo magro', emoji: '🥩', clusters: ['protein'], department: 'macelleria', kcal: 130, p: 21, c: 0, f: 5, tags: ['meat'], unit: 'g', step: 10, min: 80, max: 280 },
  { id: 'pesce-bianco', name: 'Pesce bianco (merluzzo/orata)', emoji: '🐟', clusters: ['protein'], department: 'macelleria', kcal: 80, p: 17, c: 0, f: 0.7, tags: ['fish'], unit: 'g', step: 10, min: 100, max: 350 },
  { id: 'salmone', name: 'Salmone', emoji: '🐟', clusters: ['protein'], department: 'macelleria', kcal: 185, p: 20, c: 0, f: 12, tags: ['fish'], unit: 'g', step: 10, min: 80, max: 220 },
  { id: 'tonno', name: 'Tonno al naturale', emoji: '🐟', clusters: ['protein'], department: 'dispensa', kcal: 103, p: 24, c: 0, f: 1, tags: ['fish'], unit: 'g', step: 10, min: 60, max: 240 },
  { id: 'uova', name: 'Uova', emoji: '🥚', clusters: ['protein'], department: 'latticini', kcal: 143, p: 12.6, c: 0.7, f: 9.5, tags: ['egg'], unit: 'g', step: 60, min: 120, max: 240, piece: { grams: 60, singular: 'uovo', plural: 'uova' } },
  { id: 'legumi', name: 'Legumi cotti (ceci/lenticchie/fagioli)', emoji: '🫘', clusters: ['protein'], department: 'dispensa', kcal: 120, p: 8, c: 18, f: 0.6, tags: [], unit: 'g', step: 10, min: 100, max: 350 },
  { id: 'fiocchi-latte', name: 'Fiocchi di latte', emoji: '🧀', clusters: ['protein', 'snack'], department: 'latticini', kcal: 100, p: 12, c: 3, f: 4.5, tags: ['lactose', 'dairy'], unit: 'g', step: 10, min: 100, max: 300 },
  { id: 'mozzarella-light', name: 'Mozzarella light', emoji: '🧀', clusters: ['protein'], department: 'latticini', kcal: 165, p: 20, c: 1, f: 9, tags: ['lactose', 'dairy'], unit: 'g', step: 10, min: 60, max: 200 },
  { id: 'bresaola', name: 'Bresaola', emoji: '🥓', clusters: ['protein'], department: 'macelleria', kcal: 151, p: 32, c: 0, f: 2, tags: ['meat'], unit: 'g', step: 10, min: 50, max: 160 },
  { id: 'fesa-affettato', name: 'Fesa di tacchino affettata', emoji: '🥓', clusters: ['protein'], department: 'macelleria', kcal: 100, p: 21, c: 1, f: 1.5, tags: ['meat'], unit: 'g', step: 10, min: 50, max: 200 },
  { id: 'tofu', name: 'Tofu', emoji: '🌱', clusters: ['protein'], department: 'latticini', kcal: 145, p: 15, c: 2, f: 8, tags: [], unit: 'g', step: 10, min: 100, max: 250 },

  // ---- Verdure ----
  { id: 'verdure', name: 'Verdure di stagione', emoji: '🥦', clusters: ['veg'], department: 'ortofrutta', kcal: 25, p: 2, c: 4, f: 0.3, tags: [], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'insalata', name: 'Insalata mista', emoji: '🥗', clusters: ['veg'], department: 'ortofrutta', kcal: 18, p: 1.5, c: 2.5, f: 0.3, tags: [], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'zucchine', name: 'Zucchine', emoji: '🥒', clusters: ['veg'], department: 'ortofrutta', kcal: 17, p: 1.3, c: 1.4, f: 0.1, tags: [], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'broccoli', name: 'Broccoli', emoji: '🥦', clusters: ['veg'], department: 'ortofrutta', kcal: 34, p: 3, c: 4, f: 0.4, tags: [], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'spinaci', name: 'Spinaci', emoji: '🥬', clusters: ['veg'], department: 'ortofrutta', kcal: 23, p: 3, c: 1, f: 0.7, tags: [], unit: 'g', step: 10, min: 100, max: 400 },
  { id: 'pomodori', name: 'Pomodori', emoji: '🍅', clusters: ['veg'], department: 'ortofrutta', kcal: 18, p: 1, c: 3, f: 0.2, tags: [], unit: 'g', step: 10, min: 100, max: 400 },

  // ---- Grassi ----
  { id: 'olio', name: 'Olio EVO', emoji: '🫒', clusters: ['fat'], department: 'dispensa', kcal: 899, p: 0, c: 0, f: 100, tags: [], unit: 'g', step: 5, min: 5, max: 30 },
  { id: 'frutta-secca', name: 'Frutta secca (mandorle/noci)', emoji: '🥜', clusters: ['fat', 'snack'], department: 'dispensa', kcal: 600, p: 20, c: 8, f: 52, tags: [], unit: 'g', step: 5, min: 10, max: 40 },
  { id: 'avocado', name: 'Avocado', emoji: '🥑', clusters: ['fat'], department: 'ortofrutta', kcal: 160, p: 2, c: 9, f: 15, tags: [], unit: 'g', step: 10, min: 30, max: 150 },

  // ---- Frutta ----
  { id: 'frutta', name: 'Frutta di stagione', emoji: '🍎', clusters: ['fruit'], department: 'ortofrutta', kcal: 50, p: 0.6, c: 12, f: 0.2, tags: [], unit: 'g', step: 10, min: 100, max: 350 },
  { id: 'banana', name: 'Banana', emoji: '🍌', clusters: ['fruit'], department: 'ortofrutta', kcal: 89, p: 1.1, c: 23, f: 0.3, tags: [], unit: 'g', step: 10, min: 80, max: 250 },
  { id: 'mela', name: 'Mela', emoji: '🍏', clusters: ['fruit'], department: 'ortofrutta', kcal: 52, p: 0.3, c: 14, f: 0.2, tags: [], unit: 'g', step: 10, min: 100, max: 350 },
  { id: 'frutti-bosco', name: 'Frutti di bosco', emoji: '🫐', clusters: ['fruit'], department: 'ortofrutta', kcal: 45, p: 1, c: 10, f: 0.3, tags: [], unit: 'g', step: 10, min: 80, max: 300 },

  // ---- Snack extra ----
  { id: 'cioccolato', name: 'Cioccolato fondente 85%', emoji: '🍫', clusters: ['snack'], department: 'dispensa', kcal: 600, p: 11, c: 20, f: 50, tags: [], unit: 'g', step: 5, min: 10, max: 30 },
];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

export function getFood(id: string): Food {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`Alimento sconosciuto: ${id}`);
  return f;
}

export const DEPARTMENTS: Record<Food['department'], { label: string; emoji: string; order: number }> = {
  ortofrutta: { label: 'Ortofrutta', emoji: '🥬', order: 0 },
  macelleria: { label: 'Macelleria / Pesce', emoji: '🥩', order: 1 },
  dispensa: { label: 'Dispensa / Cereali', emoji: '🌾', order: 2 },
  latticini: { label: 'Latticini / Uova / Frigo', emoji: '🥚', order: 3 },
};
