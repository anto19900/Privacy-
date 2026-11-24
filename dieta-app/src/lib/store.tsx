import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { calcTargets } from './nutrition';
import { generateWeek, swapItem } from './plan';
import { clearAll, load, save } from './storage';
import { isoDate } from './format';
import type { ExtraItem, MealKey, Profile, ShoppingState, Targets, WeekPlan, WeightEntry } from './types';

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
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  const [plan, setPlan] = useState<WeekPlan | null>(() => load<WeekPlan | null>('plan', null));
  const [weights, setWeights] = useState<WeightEntry[]>(() => load<WeightEntry[]>('weights', []));
  const [shopping, setShopping] = useState<ShoppingState>(() => load<ShoppingState>('shopping', { checked: {}, extras: [] }));

  useEffect(() => save('profile', profile), [profile]);
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
        setPlan(generateWeek(p, calcTargets(p).kcal));
        setShopping((s) => ({ ...s, checked: {} }));
      }
      if (first) upsertWeight(isoDate(), p.weightKg);
    },
    [profile, upsertWeight],
  );

  const regenerate = useCallback(() => {
    if (!profile) return;
    setPlan(generateWeek(profile, calcTargets(profile).kcal));
    setShopping((s) => ({ ...s, checked: {} }));
  }, [profile]);

  const swap = useCallback((day: number, mealKey: MealKey, itemIndex: number, foodId: string) => {
    setPlan((pl) => {
      if (!pl) return pl;
      const days = pl.days.map((d, di) =>
        di !== day
          ? d
          : {
              meals: d.meals.map((m) =>
                m.key !== mealKey ? m : { ...m, items: m.items.map((it, ii) => (ii === itemIndex ? swapItem(it, foodId) : it)) },
              ),
            },
      );
      return { ...pl, days };
    });
  }, []);

  const value: Store = {
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
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore fuori da StoreProvider');
  return s;
}
