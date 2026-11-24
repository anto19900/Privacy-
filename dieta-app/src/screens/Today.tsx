import { CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { MacroSummary } from '../components/MacroSummary';
import { MammaButton } from '../components/MammaButton';
import { MealCard } from '../components/MealCard';
import { ShareSheet } from '../components/ShareSheet';
import { dayMessage } from '../lib/messages';
import { dayItems, DAYS, sumMacros, todayIndex } from '../lib/plan';
import { useStore } from '../lib/store';

export function Today({ onOpenWeek }: { onOpenWeek: () => void }) {
  const { plan, profile, targets } = useStore();
  const [share, setShare] = useState(false);
  if (!plan || !profile || !targets) return null;

  const d = todayIndex();
  const day = plan.days[d];
  const totals = sumMacros(dayItems(day));
  const date = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-emerald-700">{DAYS[d]} {date}</p>
        <h1 className="text-2xl font-extrabold text-slate-900">Ciao{profile.name ? ` ${profile.name}` : ''}! 👋</h1>
      </div>

      <MammaButton onClick={() => setShare(true)} />
      <MacroSummary targets={targets} actual={totals} />

      {day.meals.map((m) => (
        <MealCard key={m.key} meal={m} dayIndex={d} />
      ))}

      <button className="btn-ghost w-full" onClick={onOpenWeek}>
        <CalendarDays size={20} /> Vedi tutta la settimana
      </button>

      <ShareSheet open={share} onClose={() => setShare(false)} title="Menù di oggi per Mamma" text={dayMessage(day, d, profile, true)} />
    </div>
  );
}
