import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { calcTargets } from './nutrition';
import { generateWeek, PLAN_VERSION, swapInDay } from './plan';
import { clearAll, load, save } from './storage';
import { isoDate } from './format';
import { applyReminders, DEFAULT_REMINDERS, type ApplyResult } from './notifications';
import type { ExtraItem, FoodLog, MealKey, MealLog, Profile, Reminders, ShoppingState, Targets, WeekPlan, WeightEntry } from './types';

interface Store {
  profile: Profile | null;
  targets: Targets | null;
  plan: WeekPlan | null;
  weights: WeightEntry[];
  shopping: ShoppingState;
  saveProfile: (p: Profile, regenerate: boolean) => void;
  regenerate: () => void;
  swap: (day: number, meal: MealKey, itemIndex: number, foodId: string) => void;
  addWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
  toggleItem: (foodId: string) => void;
  toggleExtra: (id: string) => void;
  addExtra: (name: string) => void;
  removeExtra: (id: string) => void;
  resetChecks: () => void;
  resetAll: () => void;
  foodLog: FoodLog;
  logMeal: (date: string, meal: MealKey, log: MealLog | null) => void;
  reminders: Reminders;
  setReminders: (r: Reminders) => Promise<ApplyResult>;
  applyKcalAdjust: (delta: number) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  const [plan, setPlan] = useState<WeekPlan | null>(() => {
    const saved = load<WeekPlan | null>('plan', null);
    const prof = load<Profile | null>('profile', null);
    // piano creato con una versione precedente dell'algoritmo: lo rigenera rispettando i macro
    if (prof && (!saved || saved.version !== PLAN_VERSION)) return generateWeek(prof);
    return saved;
  });
  const [weights, setWeights] = useState<WeightEntry[]>(() => load<WeightEntry[]>('weights', []));
  const [shopping, setShopping] = useState<ShoppingState>(() => load<ShoppingState>('shopping', { checked: {}, extras: [] }));

  const [foodLog, setFoodLog] = useState<FoodLog>(() => load<FoodLog>('foodLog', {}));
  const [reminders, setRemindersState] = useState<Reminders>(() => ({ ...DEFAULT_REMINDERS, ...load<Partial<Reminders>>('reminders', {}) }));

  useEffect(() => save('profile', profile), [profile]);
  useEffect(() => save('foodLog', foodLog), [foodLog]);
  useEffect(() => save('reminders', reminders), [reminders]);
  useEffect(() => save('plan', plan), [plan]);
  useEffect(() => save('weights', weights), [weights]);
  useEffect(() => save('shopping', shopping), [shopping]);

  const targets = useMemo(() => (profile ? calcTargets(profile) : null), [profile]);

  const upsertWeight = useCallback((date: string, kg: number) => {
    setWeights((ws) => [...ws.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  const saveProfile = useCallback(
    (p: Profile, regenerate: boolean) => {
      const first = profile === null;
      setProfile(p);
      if (regenerate || first) {
        setPlan(generateWeek(p));
        setShopping((s) => ({ ...s, checked: {} }));
      }
      if (first) upsertWeight(isoDate(), p.weightKg);
    },
    [profile, upsertWeight],
  );

  const regenerate = useCallback(() => {
    if (!profile) return;
    setPlan(generateWeek(profile));
    setShopping((s) => ({ ...s, checked: {} }));
  }, [profile]);

  const swap = useCallback(
    (day: number, mealKey: MealKey, itemIndex: number, foodId: string) => {
      if (!targets) return;
      setPlan((pl) => {
        if (!pl) return pl;
        const days = pl.days.map((d, di) => (di === day ? swapInDay(d, mealKey, itemIndex, foodId, targets.perDay[di]) : d));
        return { ...pl, days };
      });
    },
    [targets],
  );

  const logMeal = useCallback((date: string, meal: MealKey, log: MealLog | null) => {
    setFoodLog((fl) => {
      const day = { ...(fl[date] ?? {}) };
      if (log) day[meal] = log;
      else delete day[meal];
      const next = { ...fl, [date]: day };
      if (Object.keys(day).length === 0) delete next[date];
      return next;
    });
  }, []);

  const setReminders = useCallback(async (r: Reminders) => {
    setRemindersState(r);
    return applyReminders(r);
  }, []);

  const applyKcalAdjust = useCallback(
    (delta: number) => {
      if (!profile) return;
      const p = { ...profile, kcalAdjust: Math.round((profile.kcalAdjust ?? 0) + delta) };
      setProfile(p);
      setPlan(generateWeek(p));
    },
    [profile],
  );

  const value: Store = {
    foodLog,
    logMeal,
    reminders,
    setReminders,
    applyKcalAdjust,
    profile,
    targets,
    plan,
    weights,
    shopping,
    saveProfile,
    regenerate,
    swap,
    addWeight: upsertWeight,
    removeWeight: (date) => setWeights((ws) => ws.filter((w) => w.date !== date)),
    toggleItem: (id) => setShopping((s) => ({ ...s, checked: { ...s.checked, [id]: !s.checked[id] } })),
    toggleExtra: (id) =>
      setShopping((s) => ({ ...s, extras: s.extras.map((e) => (e.id === id ? { ...e, checked: !e.checked } : e)) })),
    addExtra: (name) =>
      setShopping((s) => {
        const item: ExtraItem = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, checked: false };
        return { ...s, extras: [...s.extras, item] };
      }),
    removeExtra: (id) => setShopping((s) => ({ ...s, extras: s.extras.filter((e) => e.id !== id) })),
    resetChecks: () =>
      setShopping((s) => ({ checked: {}, extras: s.extras.map((e) => ({ ...e, checked: false })) })),
    resetAll: () => {
      clearAll();
      setProfile(null);
      setPlan(null);
      setWeights([]);
      setShopping({ checked: {}, extras: [] });
      setFoodLog({});
      void setReminders(DEFAULT_REMINDERS);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuori da StoreProvider');
  return s;
}
