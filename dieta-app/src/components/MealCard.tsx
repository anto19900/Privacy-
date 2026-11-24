import { ArrowLeftRight, Check } from 'lucide-react';
import { useState } from 'react';
import { getFood } from '../lib/foods';
import { fmtQty } from '../lib/format';
import { alternativesFor, CLUSTER_LABEL, MEALS, sumMacros } from '../lib/plan';
import { useStore } from '../lib/store';
import type { Meal, MealItem } from '../lib/types';
import { Sheet } from './Sheet';

interface Props {
  meal: Meal;
  dayIndex: number;
  compact?: boolean;
}

export function MealCard({ meal, dayIndex, compact }: Props) {
  const { profile, swap } = useStore();
  const [editing, setEditing] = useState<number | null>(null);
  const info = MEALS[meal.key];
  const tot = sumMacros(meal.items);
  const current: MealItem | null = editing !== null ? meal.items[editing] : null;
  const alts = current && profile ? alternativesFor(current, profile) : [];

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <span className="text-xl">{info.emoji}</span> {info.label}
        </h3>
        <span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">
          {Math.round(tot.kcal)} kcal
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {meal.items.map((it, i) => {
          const f = getFood(it.foodId);
          return (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="text-2xl leading-none">{f.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{f.name}</p>
                <p className="text-sm text-emerald-700 font-semibold">{fmtQty(it.foodId, it.grams)}</p>
              </div>
              <button
                onClick={() => setEditing(i)}
                className={`flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800 active:bg-emerald-100 ${
                  compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'
                }`}
                aria-label={`Cambia ${f.name}`}
              >
                <ArrowLeftRight size={16} /> Cambia
              </button>
            </li>
          );
        })}
      </ul>
      {!compact && (
        <p className="mt-2 text-xs text-slate-500">
          P {Math.round(tot.p)}g · C {Math.round(tot.c)}g · G {Math.round(tot.f)}g
        </p>
      )}

      <Sheet
        open={current !== null}
        onClose={() => setEditing(null)}
        title="Alternative equivalenti"
        subtitle={current ? `${CLUSTER_LABEL[current.cluster]} · grammature ricalcolate a parità di calorie` : ''}
      >
        {current && (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-3">
              <span className="text-2xl">{getFood(current.foodId).emoji}</span>
              <div className="flex-1">
                <p className="font-semibold">{getFood(current.foodId).name}</p>
                <p className="text-sm text-emerald-700">{fmtQty(current.foodId, current.grams)} · attuale</p>
              </div>
              <Check className="text-emerald-600" />
            </div>
            <p className="pt-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">oppure</p>
            {alts.length === 0 && <p className="text-center text-slate-500">Nessuna alternativa compatibile con le tue preferenze.</p>}
            {alts.map((a) => {
              const f = getFood(a.foodId);
              return (
                <button
                  key={a.foodId}
                  onClick={() => {
                    if (editing !== null) swap(dayIndex, meal.key, editing, a.foodId);
                    setEditing(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left active:bg-emerald-50"
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{f.name}</p>
                    <p className="text-sm text-slate-500">{Math.round((f.kcal * a.grams) / 100)} kcal</p>
                  </div>
                  <span className="rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-bold text-white">{fmtQty(a.foodId, a.grams)}</span>
                </button>
              );
            })}
          </div>
        )}
      </Sheet>
    </div>
  );
}
