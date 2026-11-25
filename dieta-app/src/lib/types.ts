export type Sex = 'M' | 'F';
export type Activity = 'sedentario' | 'leggero' | 'moderato' | 'intenso';
export type Goal = 'dimagrimento' | 'mantenimento' | 'massa';
export type Variety = 'alta' | 'media' | 'bassa';
export type DietType = 'onnivoro' | 'pescetariano' | 'vegetariano' | 'vegano';

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  activity: Activity;
  goal: Goal;
  /** Kg da perdere a settimana (solo per Dimagrimento): 0.5 – 1.5 */
  weeklyRateKg?: number;
  diet: DietType;
  freeMeal?: FreeMeal;
  /** correzione kcal suggerita dalla stima del TDEE reale (applicata dall'utente) */
  kcalAdjust?: number;
  lactoseFree: boolean;
  glutenFree: boolean;
  excludedFoods: string[]; // id alimenti esclusi ("mai più")
  /** alimenti preferiti: il generatore li propone più spesso */
  favoriteFoods?: string[];
  /** varietà del piano: bassa = meno alimenti diversi e spesa più semplice */
  variety?: Variety;
  /** giorni di allenamento (0 = Lunedì): più carboidrati, meno nei giorni di riposo */
  trainingDays?: number[];
  theme?: 'system' | 'light' | 'dark';
}

export interface FreeMeal {
  enabled: boolean;
  day: number; // 0 = Lunedì
  meal: 'pranzo' | 'cena';
  kcal: number; // stima calorie del pasto libero
}

export interface MacroTarget {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export interface Targets {
  bmr: number;
  tdee: number;
  kcal: number;
  /** kcal/giorno rispetto al TDEE (negativo = deficit) */
  dailyDelta: number;
  /** Variazione di peso teorica a settimana (kg, negativa = calo) */
  weeklyChangeKg: number;
  /** true se le calorie sono state alzate al minimo di sicurezza */
  floorApplied: boolean;
  /** media giornaliera settimanale (pasto libero incluso) */
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** target dei pasti pianificati per ogni giorno (0 = Lunedì), pasto libero escluso */
  perDay: MacroTarget[];
  /** pasto libero effettivo (null se disattivato) */
  freeMeal: (FreeMeal & { capped: boolean }) | null;
}

export type Cluster =
  | 'carb'
  | 'protein'
  | 'veg'
  | 'fat'
  | 'colazioneCarb'
  | 'colazioneProt'
  | 'fruit'
  | 'snack'
  | 'snackCarb'
  | 'topping';

export type Department = 'ortofrutta' | 'macelleria' | 'dispensa' | 'latticini';

export type FoodTag = 'meat' | 'fish' | 'egg' | 'lactose' | 'gluten' | 'dairy';

export interface Food {
  id: string;
  name: string;
  clusters: Cluster[];
  department: Department;
  kcal: number; // per 100 g/ml
  p: number;
  c: number;
  f: number;
  tags: FoodTag[];
  unit: 'g' | 'ml';
  step: number; // arrotondamento
  min: number;
  max: number;
  /** unità "a pezzi": il piano usa multipli interi (o mezzi, se half) */
  piece?: { grams: number; singular: string; plural: string; half?: boolean };
  /** misura casalinga solo indicativa (es. ≈ 2 cucchiai), il piano resta in grammi */
  household?: { grams: number; singular: string; plural: string };
  /** Usato dal generatore solo se non ci sono alternative "principali" (resta sempre selezionabile con Cambia). */
  fallback?: boolean;
  emoji: string;
}

export type MealKey = 'colazione' | 'spuntino' | 'pranzo' | 'merenda' | 'cena';

export interface MealItem {
  foodId: string;
  grams: number;
  cluster: Cluster;
  /** quantità scelta a mano: l'ottimizzatore non la cambia */
  locked?: boolean;
}

export interface Meal {
  key: MealKey;
  items: MealItem[];
  /** pasto libero: nessun alimento pianificato */
  free?: boolean;
}

export interface DayPlan {
  meals: Meal[];
}

export interface WeekPlan {
  version: number;
  createdAt: string;
  days: DayPlan[]; // 0 = Lunedì
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface ExtraItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface ShoppingState {
  checked: Record<string, boolean>;
  extras: ExtraItem[];
  /** spesa divisa in due (Lun–Gio / Ven–Dom) */
  split?: boolean;
}

/** alimenti che si hanno già in dispensa (esclusi dalla lista) */
export type Pantry = Record<string, boolean>;

// ---------- Diario dei pasti ----------
export type MealStatus = 'done' | 'skipped' | 'other';

export interface MealLog {
  status: MealStatus;
  kcal: number;
  p: number;
  c: number;
  f: number;
  /** alimenti effettivamente mangiati (per "done") */
  items?: MealItem[];
}

export type DayLog = Partial<Record<MealKey, MealLog>>;
/** chiave = data ISO (YYYY-MM-DD) */
export type FoodLog = Record<string, DayLog>;

// ---------- Promemoria ----------
export interface Reminder {
  enabled: boolean;
  /** 0 = Lunedì … 6 = Domenica, -1 = ogni giorno */
  weekday: number;
  hour: number;
  minute: number;
}

export interface Reminders {
  weigh: Reminder;
  mamma: Reminder;
  shopping: Reminder;
}

// ---------- Misure corporee ----------
export interface Measurement {
  date: string; // YYYY-MM-DD
  waist?: number; // vita (cm, all'ombelico)
  hips?: number; // fianchi
  neck?: number; // collo (serve per la stima della % di grasso)
  chest?: number;
  arm?: number;
  thigh?: number;
  photoId?: string; // foto in IndexedDB
}

// ---------- Terapia (promemoria farmaco a step) ----------
export interface TherapyStep {
  months: number; // durata in mesi di calendario
  dose: string; // es. "1,5 mg"
}

export interface Therapy {
  enabled: boolean;
  name: string;
  startDate: string; // YYYY-MM-DD
  steps: TherapyStep[];
  hour: number;
  minute: number;
  instructions: string;
  /** controllo medico all'inizio del mese indicato (es. 5 = quinto mese) */
  checkupMonth?: number;
  checkupNote?: string;
}

/** data ISO → presa */
export type TherapyLog = Record<string, boolean>;
