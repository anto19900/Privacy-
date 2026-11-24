import type { Cluster, Department, Food, FoodTag } from './types';

type Extra = Partial<Pick<Food, 'piece' | 'fallback' | 'unit'>>;

/** Helper compatto: valori per 100 g/ml (alimenti crudi salvo indicazione). */
function F(
  id: string, name: string, emoji: string, clusters: Cluster[], department: Department,
  [kcal, p, c, f]: [number, number, number, number],
  tags: FoodTag[], [step, min, max]: [number, number, number], extra: Extra = {},
): Food {
  return { id, name, emoji, clusters, department, kcal, p, c, f, tags, unit: extra.unit ?? 'g', step, min, max, piece: extra.piece, fallback: extra.fallback };
}

const G: FoodTag[] = ['gluten'];
const LD: FoodTag[] = ['lactose', 'dairy'];

export const FOODS: Food[] = [
  // ---------- Carboidrati (pranzo / cena) ----------
  F('pasta', 'Pasta', '🍝', ['carb'], 'dispensa', [353, 12.5, 71, 1.5], G, [5, 30, 250]),
  F('pasta-integrale', 'Pasta integrale', '🍝', ['carb'], 'dispensa', [340, 13, 64, 2.5], G, [5, 30, 250]),
  F('pasta-legumi', 'Pasta di legumi', '🍝', ['carb'], 'dispensa', [340, 25, 50, 2.5], [], [5, 30, 130]),
  F('pasta-sg', 'Pasta senza glutine', '🍝', ['carb'], 'dispensa', [355, 7, 78, 1.5], [], [5, 30, 250], { fallback: true }),
  F('riso', 'Riso', '🍚', ['carb'], 'dispensa', [350, 7, 78, 0.6], [], [5, 30, 250]),
  F('riso-integrale', 'Riso integrale / venere', '🍚', ['carb'], 'dispensa', [337, 7.5, 72, 2], [], [5, 30, 250]),
  F('patate', 'Patate', '🥔', ['carb'], 'ortofrutta', [77, 2, 17, 0.1], [], [10, 100, 800]),
  F('patate-dolci', 'Patate dolci', '🍠', ['carb'], 'ortofrutta', [86, 1.6, 20, 0.1], [], [10, 100, 700]),
  F('pane-integrale', 'Pane integrale', '🍞', ['carb', 'colazioneCarb', 'snackCarb'], 'dispensa', [240, 9, 44, 2.5], G, [5, 25, 220]),
  F('pane-segale', 'Pane di segale', '🍞', ['carb', 'colazioneCarb', 'snackCarb'], 'dispensa', [220, 7, 45, 1.5], G, [5, 25, 220]),
  F('farro', 'Farro', '🌾', ['carb'], 'dispensa', [335, 15, 67, 2.5], G, [5, 30, 250]),
  F('orzo', 'Orzo perlato', '🌾', ['carb'], 'dispensa', [320, 10, 70, 1.5], G, [5, 30, 250]),
  F('grano-saraceno', 'Grano saraceno', '🌾', ['carb'], 'dispensa', [340, 13, 70, 3.4], [], [5, 30, 250]),
  F('cous-cous', 'Cous cous', '🥣', ['carb'], 'dispensa', [360, 12.5, 72, 1.5], G, [5, 30, 250]),
  F('quinoa', 'Quinoa', '🥣', ['carb'], 'dispensa', [368, 14, 64, 6], [], [5, 30, 250]),
  F('gnocchi', 'Gnocchi di patate', '🥟', ['carb'], 'latticini', [150, 3.5, 33, 0.5], G, [10, 100, 450]),
  F('polenta', 'Polenta (farina di mais)', '🌽', ['carb'], 'dispensa', [360, 8, 77, 2.5], [], [5, 30, 250]),
  F('gallette', 'Gallette di riso', '🍘', ['carb', 'colazioneCarb', 'snackCarb'], 'dispensa', [380, 8, 81, 3], [], [8, 16, 160], { piece: { grams: 8, singular: 'galletta', plural: 'gallette' } }),
  F('crackers', 'Crackers integrali', '🍪', ['snackCarb'], 'dispensa', [420, 11, 68, 10], G, [5, 15, 60]),

  // ---------- Colazione: carboidrati ----------
  F('avena', "Fiocchi d'avena", '🥣', ['colazioneCarb'], 'dispensa', [370, 13, 60, 7], G, [5, 20, 150]),
  F('fette-biscottate', 'Fette biscottate integrali', '🍞', ['colazioneCarb', 'snackCarb'], 'dispensa', [400, 12, 70, 6], G, [10, 20, 100], { piece: { grams: 10, singular: 'fetta biscottata', plural: 'fette biscottate' } }),
  F('corn-flakes', 'Cereali tipo corn flakes', '🥣', ['colazioneCarb'], 'dispensa', [375, 7, 84, 1], [], [5, 20, 90]),
  F('muesli', 'Muesli senza zuccheri', '🥣', ['colazioneCarb'], 'dispensa', [360, 10, 62, 6], G, [5, 20, 100]),

  // ---------- Colazione: latte / yogurt / proteine ----------
  F('yogurt-greco', 'Yogurt greco 0%', '🥛', ['colazioneProt', 'snack'], 'latticini', [57, 10, 4, 0.2], LD, [10, 80, 450]),
  F('skyr', 'Skyr', '🥛', ['colazioneProt', 'snack'], 'latticini', [63, 11, 4, 0.2], LD, [10, 80, 450]),
  F('yogurt-proteico', 'Yogurt proteico (senza lattosio)', '🥛', ['colazioneProt', 'snack'], 'latticini', [55, 10, 3.5, 0.2], ['dairy'], [10, 80, 450]),
  F('latte-ps', 'Latte parz. scremato', '🥛', ['colazioneProt'], 'latticini', [46, 3.3, 5, 1.6], LD, [10, 100, 500], { unit: 'ml' }),
  F('latte-zl', 'Latte senza lattosio', '🥛', ['colazioneProt'], 'latticini', [46, 3.3, 5, 1.6], ['dairy'], [10, 100, 500], { unit: 'ml', fallback: true }),
  F('yogurt-greco-zl', 'Yogurt greco senza lattosio', '🥛', ['colazioneProt', 'snack'], 'latticini', [60, 10, 4, 0.5], ['dairy'], [10, 80, 450], { fallback: true }),
  F('bevanda-soia', 'Bevanda di soia', '🌱', ['colazioneProt'], 'latticini', [33, 3.3, 0.7, 1.8], [], [10, 100, 500], { unit: 'ml', fallback: true }),
  F('yogurt-soia', 'Yogurt di soia', '🌱', ['colazioneProt', 'snack'], 'latticini', [50, 4, 2, 2.3], [], [10, 80, 450], { fallback: true }),
  F('proteine-polvere', 'Proteine in polvere (whey)', '💪', ['colazioneProt', 'snack'], 'dispensa', [380, 78, 7, 5], ['dairy'], [5, 15, 40], { fallback: true }),
  F('proteine-vegetali', 'Proteine vegetali in polvere', '💪', ['colazioneProt', 'snack'], 'dispensa', [370, 75, 6, 6], [], [5, 15, 40], { fallback: true }),

  // ---------- Proteine (pranzo / cena) ----------
  F('pollo', 'Petto di pollo', '🍗', ['protein'], 'macelleria', [110, 23, 0, 1.5], ['meat'], [10, 60, 300]),
  F('tacchino', 'Fesa di tacchino', '🦃', ['protein'], 'macelleria', [107, 24, 0, 1], ['meat'], [10, 60, 300]),
  F('manzo', 'Manzo magro', '🥩', ['protein'], 'macelleria', [130, 21, 0, 5], ['meat'], [10, 60, 280]),
  F('vitello', 'Fesa di vitello', '🥩', ['protein'], 'macelleria', [110, 21, 0, 2.5], ['meat'], [10, 60, 280]),
  F('lonza', 'Lonza di maiale', '🥩', ['protein'], 'macelleria', [140, 22, 0, 6], ['meat'], [10, 60, 250]),
  F('pesce-bianco', 'Pesce bianco (merluzzo/orata)', '🐟', ['protein'], 'macelleria', [80, 17, 0, 0.7], ['fish'], [10, 80, 400]),
  F('salmone', 'Salmone', '🐟', ['protein'], 'macelleria', [185, 20, 0, 12], ['fish'], [10, 60, 220]),
  F('tonno', 'Tonno al naturale', '🐟', ['protein'], 'dispensa', [103, 24, 0, 1], ['fish'], [10, 50, 240]),
  F('gamberi', 'Gamberi', '🦐', ['protein'], 'macelleria', [85, 18, 0.5, 1], ['fish'], [10, 80, 350]),
  F('calamari', 'Calamari / polpo', '🦑', ['protein'], 'macelleria', [75, 15, 1.5, 1], ['fish'], [10, 80, 350]),
  F('uova', 'Uova', '🥚', ['protein'], 'latticini', [143, 12.6, 0.7, 9.5], ['egg'], [60, 60, 240], { piece: { grams: 60, singular: 'uovo', plural: 'uova' } }),
  F('albumi', 'Albumi', '🥚', ['protein'], 'latticini', [48, 11, 0.7, 0.2], ['egg'], [10, 60, 400]),
  F('legumi', 'Legumi cotti (ceci/lenticchie/fagioli)', '🫘', ['protein'], 'dispensa', [120, 8, 18, 0.6], [], [10, 80, 400]),
  F('fiocchi-latte', 'Fiocchi di latte', '🧀', ['protein', 'snack'], 'latticini', [100, 12, 3, 4.5], LD, [10, 80, 300]),
  F('ricotta-light', 'Ricotta light', '🧀', ['protein'], 'latticini', [110, 10, 4, 6], LD, [10, 60, 250]),
  F('mozzarella-light', 'Mozzarella light', '🧀', ['protein'], 'latticini', [165, 20, 1, 9], LD, [10, 50, 200]),
  F('bresaola', 'Bresaola', '🥓', ['protein', 'snack'], 'macelleria', [151, 32, 0, 2], ['meat'], [10, 30, 160]),
  F('fesa-affettato', 'Fesa di tacchino affettata', '🥓', ['protein', 'snack'], 'macelleria', [100, 21, 1, 1.5], ['meat'], [10, 40, 200]),
  F('crudo-sgrassato', 'Prosciutto crudo sgrassato', '🥓', ['protein'], 'macelleria', [160, 29, 0, 5], ['meat'], [10, 30, 150]),
  F('tofu', 'Tofu', '🌱', ['protein'], 'latticini', [145, 15, 2, 8], [], [10, 80, 300]),
  F('tempeh', 'Tempeh', '🌱', ['protein'], 'latticini', [190, 19, 9, 11], [], [10, 60, 250]),
  F('seitan', 'Seitan', '🌱', ['protein'], 'latticini', [120, 21, 4, 2], G, [10, 60, 300]),
  F('edamame', 'Edamame', '🫛', ['protein', 'snack'], 'ortofrutta', [120, 11, 9, 5], [], [10, 60, 300]),

  // ---------- Verdure ----------
  F('verdure', 'Verdure di stagione', '🥦', ['veg'], 'ortofrutta', [25, 2, 4, 0.3], [], [10, 100, 400]),
  F('insalata', 'Insalata mista', '🥗', ['veg'], 'ortofrutta', [18, 1.5, 2.5, 0.3], [], [10, 100, 400]),
  F('zucchine', 'Zucchine', '🥒', ['veg'], 'ortofrutta', [17, 1.3, 1.4, 0.1], [], [10, 100, 400]),
  F('broccoli', 'Broccoli', '🥦', ['veg'], 'ortofrutta', [34, 3, 4, 0.4], [], [10, 100, 400]),
  F('spinaci', 'Spinaci', '🥬', ['veg'], 'ortofrutta', [23, 3, 1, 0.7], [], [10, 100, 400]),
  F('pomodori', 'Pomodori', '🍅', ['veg'], 'ortofrutta', [18, 1, 3, 0.2], [], [10, 100, 400]),
  F('carote', 'Carote', '🥕', ['veg'], 'ortofrutta', [35, 1, 7.6, 0.2], [], [10, 100, 400]),
  F('finocchi', 'Finocchi', '🌿', ['veg'], 'ortofrutta', [20, 1.2, 3, 0.2], [], [10, 100, 400]),
  F('peperoni', 'Peperoni', '🫑', ['veg'], 'ortofrutta', [26, 1, 5, 0.3], [], [10, 100, 400]),
  F('melanzane', 'Melanzane', '🍆', ['veg'], 'ortofrutta', [20, 1, 3, 0.2], [], [10, 100, 400]),
  F('fagiolini', 'Fagiolini', '🫛', ['veg'], 'ortofrutta', [25, 2, 4, 0.1], [], [10, 100, 400]),
  F('cavolfiore', 'Cavolfiore', '🥦', ['veg'], 'ortofrutta', [25, 2, 4, 0.3], [], [10, 100, 400]),
  F('rucola', 'Rucola', '🥬', ['veg'], 'ortofrutta', [25, 2.6, 3.6, 0.7], [], [10, 100, 400]),
  F('asparagi', 'Asparagi', '🌱', ['veg'], 'ortofrutta', [20, 2.2, 2, 0.1], [], [10, 100, 400]),

  // ---------- Grassi (condimento) ----------
  F('olio', 'Olio EVO', '🫒', ['fat'], 'dispensa', [899, 0, 0, 100], [], [5, 5, 30]),
  F('avocado', 'Avocado', '🥑', ['fat'], 'ortofrutta', [160, 2, 9, 15], [], [10, 30, 150]),
  F('olive', 'Olive', '🫒', ['fat'], 'dispensa', [145, 1, 4, 15], [], [5, 20, 100]),
  F('parmigiano', 'Parmigiano Reggiano', '🧀', ['fat', 'snack'], 'latticini', [390, 33, 0, 28], ['dairy'], [5, 10, 40]),

  // ---------- Topping (colazione) ----------
  F('frutta-secca', 'Frutta secca (mandorle/noci)', '🥜', ['topping'], 'dispensa', [600, 20, 8, 52], [], [5, 5, 40]),
  F('burro-arachidi', 'Burro di arachidi 100%', '🥜', ['topping'], 'dispensa', [590, 25, 12, 50], [], [5, 5, 35]),
  F('semi', 'Semi di chia / lino', '🌰', ['topping'], 'dispensa', [490, 18, 10, 31], [], [5, 5, 30]),
  F('cioccolato', 'Cioccolato fondente 85%', '🍫', ['topping'], 'dispensa', [600, 11, 20, 50], [], [5, 5, 30]),

  // ---------- Frutta ----------
  F('frutta', 'Frutta di stagione', '🍎', ['fruit'], 'ortofrutta', [50, 0.6, 12, 0.2], [], [10, 60, 350]),
  F('banana', 'Banana', '🍌', ['fruit'], 'ortofrutta', [89, 1.1, 23, 0.3], [], [10, 60, 250]),
  F('mela', 'Mela', '🍏', ['fruit'], 'ortofrutta', [52, 0.3, 14, 0.2], [], [10, 60, 350]),
  F('frutti-bosco', 'Frutti di bosco', '🫐', ['fruit'], 'ortofrutta', [45, 1, 10, 0.3], [], [10, 60, 300]),
  F('kiwi', 'Kiwi', '🥝', ['fruit'], 'ortofrutta', [61, 1.1, 15, 0.5], [], [10, 60, 300]),
  F('arancia', 'Arance', '🍊', ['fruit'], 'ortofrutta', [47, 0.9, 12, 0.1], [], [10, 60, 350]),
  F('pera', 'Pera', '🍐', ['fruit'], 'ortofrutta', [57, 0.4, 15, 0.1], [], [10, 60, 350]),
  F('fragole', 'Fragole', '🍓', ['fruit'], 'ortofrutta', [32, 0.7, 7.7, 0.3], [], [10, 60, 400]),
  F('ananas', 'Ananas', '🍍', ['fruit'], 'ortofrutta', [50, 0.5, 13, 0.1], [], [10, 60, 350]),
];

const BY_ID = new Map(FOODS.map((f) => [f.id, f]));

/** Per piani salvati con alimenti rimossi o rinominati. */
const UNKNOWN: Food = F('sconosciuto', 'Alimento', '🍽️', [], 'dispensa', [100, 0, 0, 0], [], [10, 0, 1000]);

export function getFood(id: string): Food {
  return BY_ID.get(id) ?? UNKNOWN;
}

export const DEPARTMENTS: Record<Department, { label: string; emoji: string; order: number }> = {
  ortofrutta: { label: 'Ortofrutta', emoji: '🥬', order: 0 },
  macelleria: { label: 'Macelleria / Pesce', emoji: '🥩', order: 1 },
  dispensa: { label: 'Dispensa / Cereali', emoji: '🌾', order: 2 },
  latticini: { label: 'Latticini / Uova / Frigo', emoji: '🥚', order: 3 },
};
