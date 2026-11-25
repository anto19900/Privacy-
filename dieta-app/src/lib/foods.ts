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
  F('patate', 'Patate', '🥔', ['carb'], 'ortofrutta', [77, 2, 17, 0.1], [], [10, 60, 800]),
  F('patate-dolci', 'Patate dolci', '🍠', ['carb'], 'ortofrutta', [86, 1.6, 20, 0.1], [], [10, 60, 700]),
  F('pane-integrale', 'Pane integrale', '🍞', ['carb', 'colazioneCarb', 'snackCarb'], 'dispensa', [240, 9, 44, 2.5], G, [5, 20, 220]),
  F('pane-segale', 'Pane di segale', '🍞', ['carb', 'colazioneCarb', 'snackCarb'], 'dispensa', [220, 7, 45, 1.5], G, [5, 20, 220]),
  F('farro', 'Farro', '🌾', ['carb'], 'dispensa', [335, 15, 67, 2.5], G, [5, 30, 250]),
  F('orzo', 'Orzo perlato', '🌾', ['carb'], 'dispensa', [320, 10, 70, 1.5], G, [5, 30, 250]),
  F('grano-saraceno', 'Grano saraceno', '🌾', ['carb'], 'dispensa', [340, 13, 70, 3.4], [], [5, 30, 250]),
  F('cous-cous', 'Cous cous', '🥣', ['carb'], 'dispensa', [360, 12.5, 72, 1.5], G, [5, 30, 250]),
  F('quinoa', 'Quinoa', '🥣', ['carb'], 'dispensa', [368, 14, 64, 6], [], [5, 30, 250]),
  F('gnocchi', 'Gnocchi di patate', '🥟', ['carb'], 'latticini', [150, 3.5, 33, 0.5], G, [10, 80, 450]),
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
  F('uova', 'Uova', '🥚', ['protein', 'colazioneProt'], 'latticini', [143, 12.6, 0.7, 9.5], ['egg'], [60, 60, 240], { piece: { grams: 60, singular: 'uovo', plural: 'uova' } }),
  F('albumi', 'Albumi', '🥚', ['protein'], 'latticini', [48, 11, 0.7, 0.2], ['egg'], [10, 60, 400]),
  F('legumi', 'Legumi cotti (ceci/lenticchie/fagioli)', '🫘', ['protein'], 'dispensa', [120, 8, 18, 0.6], [], [10, 60, 400]),
  F('fiocchi-latte', 'Fiocchi di latte', '🧀', ['protein', 'snack', 'colazioneProt'], 'latticini', [100, 12, 3, 4.5], LD, [10, 80, 300]),
  F('ricotta-light', 'Ricotta light', '🧀', ['protein', 'colazioneProt', 'snack'], 'latticini', [110, 10, 4, 6], LD, [10, 60, 250]),
  F('mozzarella-light', 'Mozzarella light', '🧀', ['protein'], 'latticini', [165, 20, 1, 9], LD, [10, 50, 200]),
  F('bresaola', 'Bresaola', '🥓', ['protein', 'snack', 'colazioneProt'], 'macelleria', [151, 32, 0, 2], ['meat'], [10, 30, 160]),
  F('fesa-affettato', 'Fesa di tacchino affettata', '🥓', ['protein', 'snack', 'colazioneProt'], 'macelleria', [100, 21, 1, 1.5], ['meat'], [10, 40, 200]),
  F('crudo-sgrassato', 'Prosciutto crudo sgrassato', '🥓', ['protein', 'snack', 'colazioneProt'], 'macelleria', [160, 29, 0, 5], ['meat'], [10, 30, 150]),
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
  F('avocado', 'Avocado', '🥑', ['fat', 'topping'], 'ortofrutta', [160, 2, 9, 15], [], [10, 30, 150]),
  F('olive', 'Olive', '🫒', ['fat'], 'dispensa', [145, 1, 4, 15], [], [5, 20, 100]),
  F('parmigiano', 'Parmigiano Reggiano', '🧀', ['fat', 'snack'], 'latticini', [390, 33, 0, 28], ['dairy'], [5, 10, 40]),

  // ---------- Topping (colazione) ----------
  F('frutta-secca', 'Frutta secca (mandorle/noci)', '🥜', ['topping', 'snack'], 'dispensa', [600, 20, 8, 52], [], [5, 5, 40]),
  F('burro-arachidi', 'Burro di arachidi 100%', '🥜', ['topping', 'snack'], 'dispensa', [590, 25, 12, 50], [], [5, 5, 35]),
  F('semi', 'Semi di chia / lino', '🌰', ['topping'], 'dispensa', [490, 18, 10, 31], [], [5, 5, 30]),
  F('cioccolato', 'Cioccolato fondente 85%', '🍫', ['topping', 'snackCarb'], 'dispensa', [600, 11, 20, 50], [], [5, 5, 30]),

  // ---------- Frutta ----------
  F('frutta', 'Frutta di stagione', '🍎', ['fruit', 'snackCarb'], 'ortofrutta', [50, 0.6, 12, 0.2], [], [10, 50, 350]),
  F('banana', 'Banana', '🍌', ['fruit', 'snackCarb'], 'ortofrutta', [89, 1.1, 23, 0.3], [], [10, 50, 250]),
  F('mela', 'Mela', '🍏', ['fruit', 'snackCarb'], 'ortofrutta', [52, 0.3, 14, 0.2], [], [10, 50, 350]),
  F('frutti-bosco', 'Frutti di bosco', '🫐', ['fruit'], 'ortofrutta', [45, 1, 10, 0.3], [], [10, 50, 300]),
  F('kiwi', 'Kiwi', '🥝', ['fruit'], 'ortofrutta', [61, 1.1, 15, 0.5], [], [10, 50, 300]),
  F('arancia', 'Arance', '🍊', ['fruit'], 'ortofrutta', [47, 0.9, 12, 0.1], [], [10, 50, 350]),
  F('pera', 'Pera', '🍐', ['fruit'], 'ortofrutta', [57, 0.4, 15, 0.1], [], [10, 50, 350]),
  F('fragole', 'Fragole', '🍓', ['fruit'], 'ortofrutta', [32, 0.7, 7.7, 0.3], [], [10, 50, 400]),
  F('ananas', 'Ananas', '🍍', ['fruit'], 'ortofrutta', [50, 0.5, 13, 0.1], [], [10, 50, 350]),

  // ---------- Altre scelte (selezionabili con Cambia / Aggiungi) ----------
  // colazione salata e formaggi freschi
  F('formaggio-spalmabile', 'Formaggio fresco spalmabile light', '🧀', ['colazioneProt', 'snack'], 'latticini', [145, 8, 4, 11], LD, [5, 20, 100]),
  F('quark', 'Quark / formaggio magro', '🥛', ['colazioneProt', 'snack'], 'latticini', [65, 12, 4, 0.2], LD, [10, 80, 300]),
  F('stracchino-light', 'Stracchino light', '🧀', ['colazioneProt', 'protein'], 'latticini', [190, 16, 2, 13], LD, [10, 40, 150]),
  F('spalmabile-vegetale', 'Spalmabile vegetale', '🌱', ['colazioneProt', 'snack'], 'latticini', [200, 5, 8, 16], [], [5, 20, 80], { fallback: true }),
  // dolce a colazione
  F('marmellata', 'Marmellata / confettura', '🍓', ['topping'], 'dispensa', [250, 0.5, 60, 0.1], [], [5, 5, 40]),
  F('marmellata-light', 'Composta 100% frutta (senza zuccheri aggiunti)', '🍑', ['topping'], 'dispensa', [150, 0.5, 36, 0.2], [], [5, 5, 50]),
  F('miele', 'Miele', '🍯', ['topping'], 'dispensa', [304, 0.3, 82, 0], [], [5, 5, 30]),
  F('crema-nocciole', 'Crema spalmabile alle nocciole', '🌰', ['topping'], 'dispensa', [540, 6, 57, 31], LD, [5, 5, 30]),
  F('biscotti', 'Biscotti secchi', '🍪', ['colazioneCarb', 'snackCarb'], 'dispensa', [420, 7, 75, 10], G, [8, 16, 80]),
  F('cornetto', 'Cornetto semplice', '🥐', ['colazioneCarb'], 'dispensa', [410, 8, 46, 21], ['gluten', 'dairy', 'lactose', 'egg'], [50, 50, 100]),
  F('gallette-mais', 'Gallette di mais', '🌽', ['colazioneCarb', 'snackCarb', 'carb'], 'dispensa', [380, 7.5, 82, 2.5], [], [8, 16, 160]),
  F('grissini', 'Grissini integrali', '🥖', ['snackCarb', 'carb'], 'dispensa', [410, 12, 68, 9], G, [6, 12, 90]),
  // merenda
  F('barretta-proteica', 'Barretta proteica', '🍫', ['snack'], 'dispensa', [360, 33, 33, 10], ['dairy'], [50, 50, 50]),
  F('hummus', 'Hummus di ceci', '🫘', ['snack', 'fat'], 'latticini', [166, 8, 14, 9.6], [], [10, 20, 120]),
  // pranzo e cena
  F('piadina', 'Piadina integrale', '🫓', ['carb'], 'dispensa', [290, 8, 48, 7], G, [50, 50, 200]),
  F('wrap', 'Wrap / tortilla integrale', '🌯', ['carb'], 'dispensa', [300, 9, 48, 7], G, [60, 60, 180]),
  F('sgombro', 'Sgombro', '🐟', ['protein'], 'macelleria', [190, 19, 0, 12.5], ['fish'], [10, 60, 200]),
  F('pesto', 'Pesto', '🌿', ['fat'], 'dispensa', [480, 5, 5, 49], ['dairy'], [5, 10, 40]),
  // frutta
  F('uva', 'Uva', '🍇', ['fruit', 'snackCarb'], 'ortofrutta', [67, 0.6, 17, 0.4], [], [10, 60, 300]),
  F('pesca', 'Pesca', '🍑', ['fruit', 'snackCarb'], 'ortofrutta', [39, 0.9, 10, 0.3], [], [10, 75, 450]),
  F('melone', 'Melone', '🍈', ['fruit', 'snackCarb'], 'ortofrutta', [34, 0.8, 8, 0.2], [], [10, 200, 600]),
  F('anguria', 'Anguria', '🍉', ['fruit', 'snackCarb'], 'ortofrutta', [30, 0.6, 8, 0.2], [], [10, 300, 900]),
  F('mandarini', 'Mandarini / clementine', '🍊', ['fruit', 'snackCarb'], 'ortofrutta', [53, 0.8, 13, 0.3], [], [10, 80, 320]),
  F('albicocche', 'Albicocche', '🍑', ['fruit', 'snackCarb'], 'ortofrutta', [48, 1.4, 11, 0.4], [], [10, 40, 280]),
  // verdure
  F('cetrioli', 'Cetrioli', '🥒', ['veg'], 'ortofrutta', [15, 0.7, 3.6, 0.1], [], [10, 100, 400]),
  F('radicchio', 'Radicchio', '🥬', ['veg'], 'ortofrutta', [23, 1.4, 4.5, 0.3], [], [10, 100, 400]),
  F('funghi', 'Funghi', '🍄', ['veg'], 'ortofrutta', [22, 3, 3, 0.3], [], [10, 100, 400]),
  F('bietole', 'Bietole', '🥬', ['veg'], 'ortofrutta', [20, 1.8, 3.7, 0.2], [], [10, 100, 400]),
  F('cavolo', 'Cavolo cappuccio / verza', '🥬', ['veg'], 'ortofrutta', [25, 1.3, 6, 0.1], [], [10, 100, 400]),
  F('carciofi', 'Carciofi', '🌿', ['veg'], 'ortofrutta', [47, 3.3, 10, 0.2], [], [10, 100, 400]),
];

/**
 * Misure casalinghe.
 *  - half / whole: il piano usa pezzi interi (o mezzi) → "1 e ½ bicchieri (300 ml)"
 *  - hint: il piano resta in grammi, con un'indicazione → "20 g (≈ ½ manciata)"
 */
type Unit = { g: number; s: string; p: string; mode: 'half' | 'whole' | 'hint' };
const UNITS: Record<string, Unit> = {
  'latte-ps': { g: 200, s: 'bicchiere', p: 'bicchieri', mode: 'half' },
  'latte-zl': { g: 200, s: 'bicchiere', p: 'bicchieri', mode: 'half' },
  'bevanda-soia': { g: 200, s: 'bicchiere', p: 'bicchieri', mode: 'half' },
  frutta: { g: 200, s: 'frutto', p: 'frutti', mode: 'half' },
  mela: { g: 200, s: 'mela', p: 'mele', mode: 'half' },
  pera: { g: 180, s: 'pera', p: 'pere', mode: 'half' },
  arancia: { g: 200, s: 'arancia', p: 'arance', mode: 'half' },
  banana: { g: 120, s: 'banana', p: 'banane', mode: 'half' },
  kiwi: { g: 80, s: 'kiwi', p: 'kiwi', mode: 'whole' },
  ananas: { g: 100, s: 'fetta', p: 'fette', mode: 'whole' },
  'frutti-bosco': { g: 125, s: 'vaschetta', p: 'vaschette', mode: 'half' },
  fragole: { g: 150, s: 'tazza', p: 'tazze', mode: 'hint' },
  'yogurt-greco': { g: 170, s: 'vasetto', p: 'vasetti', mode: 'half' },
  skyr: { g: 150, s: 'vasetto', p: 'vasetti', mode: 'half' },
  'yogurt-proteico': { g: 150, s: 'vasetto', p: 'vasetti', mode: 'half' },
  'yogurt-greco-zl': { g: 150, s: 'vasetto', p: 'vasetti', mode: 'half' },
  'yogurt-soia': { g: 125, s: 'vasetto', p: 'vasetti', mode: 'whole' },
  'fiocchi-latte': { g: 150, s: 'vasetto', p: 'vasetti', mode: 'hint' },
  'mozzarella-light': { g: 125, s: 'mozzarella', p: 'mozzarelle', mode: 'half' },
  tonno: { g: 80, s: 'scatoletta', p: 'scatolette', mode: 'whole' },
  legumi: { g: 240, s: 'barattolo', p: 'barattoli', mode: 'hint' },
  'pane-integrale': { g: 30, s: 'fetta', p: 'fette', mode: 'whole' },
  'pane-segale': { g: 30, s: 'fetta', p: 'fette', mode: 'whole' },
  crackers: { g: 25, s: 'pacchetto', p: 'pacchetti', mode: 'half' },
  'proteine-polvere': { g: 30, s: 'misurino', p: 'misurini', mode: 'half' },
  'proteine-vegetali': { g: 30, s: 'misurino', p: 'misurini', mode: 'half' },
  cioccolato: { g: 5, s: 'quadretto', p: 'quadretti', mode: 'whole' },
  patate: { g: 150, s: 'patata media', p: 'patate medie', mode: 'hint' },
  'patate-dolci': { g: 200, s: 'patata dolce', p: 'patate dolci', mode: 'hint' },
  'frutta-secca': { g: 30, s: 'manciata', p: 'manciate', mode: 'hint' },
  'burro-arachidi': { g: 15, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  semi: { g: 10, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  parmigiano: { g: 5, s: 'cucchiaio grattugiato', p: 'cucchiai grattugiati', mode: 'hint' },
  olio: { g: 10, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  avena: { g: 10, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  'corn-flakes': { g: 30, s: 'tazza', p: 'tazze', mode: 'hint' },
  muesli: { g: 30, s: 'tazza', p: 'tazze', mode: 'hint' },
  albumi: { g: 33, s: 'albume', p: 'albumi', mode: 'hint' },
  bresaola: { g: 10, s: 'fetta', p: 'fette', mode: 'hint' },
  'fesa-affettato': { g: 15, s: 'fetta', p: 'fette', mode: 'hint' },
  'crudo-sgrassato': { g: 15, s: 'fetta', p: 'fette', mode: 'hint' },
  'formaggio-spalmabile': { g: 20, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  'spalmabile-vegetale': { g: 20, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  'stracchino-light': { g: 50, s: 'porzione da 50 g', p: 'porzioni da 50 g', mode: 'hint' },
  quark: { g: 250, s: 'vasetto', p: 'vasetti', mode: 'hint' },
  marmellata: { g: 10, s: 'cucchiaino', p: 'cucchiaini', mode: 'hint' },
  'marmellata-light': { g: 10, s: 'cucchiaino', p: 'cucchiaini', mode: 'hint' },
  miele: { g: 8, s: 'cucchiaino', p: 'cucchiaini', mode: 'hint' },
  'crema-nocciole': { g: 10, s: 'cucchiaino', p: 'cucchiaini', mode: 'hint' },
  biscotti: { g: 8, s: 'biscotto', p: 'biscotti', mode: 'whole' },
  cornetto: { g: 50, s: 'cornetto', p: 'cornetti', mode: 'whole' },
  'gallette-mais': { g: 8, s: 'galletta', p: 'gallette', mode: 'whole' },
  grissini: { g: 6, s: 'grissino', p: 'grissini', mode: 'whole' },
  'barretta-proteica': { g: 50, s: 'barretta', p: 'barrette', mode: 'whole' },
  hummus: { g: 20, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  piadina: { g: 100, s: 'piadina', p: 'piadine', mode: 'half' },
  wrap: { g: 60, s: 'wrap', p: 'wrap', mode: 'whole' },
  pesto: { g: 15, s: 'cucchiaio', p: 'cucchiai', mode: 'hint' },
  uva: { g: 150, s: 'grappolo piccolo', p: 'grappoli piccoli', mode: 'hint' },
  pesca: { g: 150, s: 'pesca', p: 'pesche', mode: 'half' },
  melone: { g: 200, s: 'fetta', p: 'fette', mode: 'whole' },
  anguria: { g: 300, s: 'fetta', p: 'fette', mode: 'whole' },
  mandarini: { g: 80, s: 'mandarino', p: 'mandarini', mode: 'whole' },
  albicocche: { g: 40, s: 'albicocca', p: 'albicocche', mode: 'whole' },
};

/** massimo per pasto in pezzi (es. non più di 2 vasetti di yogurt) */
const MAX_PIECES: Record<string, number> = {
  'yogurt-greco': 2, skyr: 2, 'yogurt-proteico': 2, 'yogurt-greco-zl': 2, 'yogurt-soia': 2,
  'latte-ps': 2, 'latte-zl': 2, 'bevanda-soia': 2, 'mozzarella-light': 1.5, 'proteine-polvere': 1, 'proteine-vegetali': 1,
};

for (const f of FOODS) {
  const u = UNITS[f.id];
  if (!u) continue;
  if (u.mode === 'hint') {
    f.household = { grams: u.g, singular: u.s, plural: u.p };
    continue;
  }
  const half = u.mode === 'half';
  f.piece = { grams: u.g, singular: u.s, plural: u.p, half };
  f.step = half ? u.g / 2 : u.g;
  f.min = Math.max(f.step, Math.floor(f.min / f.step) * f.step);
  f.max = Math.max(f.min + f.step, Math.ceil(f.max / f.step) * f.step);
  if (MAX_PIECES[f.id]) f.max = Math.max(f.min, MAX_PIECES[f.id] * u.g);
}

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
