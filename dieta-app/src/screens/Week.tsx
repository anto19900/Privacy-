import { RefreshCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { MacroSummary } from '../components/MacroSummary';
import { MammaButton } from '../components/MammaButton';
import { MealCard } from '../components/MealCard';
import { ShareSheet } from '../components/ShareSheet';
import { dayMessage, weekMessage } from '../lib/messages';
import { dayItems, DAYS, sumMacros, todayIndex } from '../lib/plan';
import { useStore } from '../lib/store';

export function Week({ initialDay, openMamma }: { initialDay?: number; openMamma?: boolean }) {
  const { plan, profile, targets, regenerate, copyFromPreviousDay, repeatMealAllWeek } = useStore();
  const [sel, setSel] = useState(initialDay ?? todayIndex());
  const [share, setShare] = useState<'day' | 'week' | null>(openMamma ? 'day' : null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>(`[data-day="${sel}"]`)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [sel]);

  if (!plan || !profile || !targets) return null;
  const day = plan.days[sel];
  const totals = sumMacros(dayItems(day));
  const today = todayIndex();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Piano settimanale</h1>
        <button
          className="rounded-xl p-3 text-emerald-700 active:bg-emerald-50"
          aria-label="Rigenera settimana"
          onClick={() => {
            if (confirm('Rigenerare il piano della settimana? Le modifiche fatte andranno perse.')) regenerate();
          }}
        >
          <RefreshCw size={22} />
        </button>
      </div>

      <div ref={tabsRef} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {DAYS.map((name, i) => (
          <button
            key={name}
            data-day={i}
            onClick={() => setSel(i)}
            className={`flex min-w-[64px] flex-col items-center rounded-2xl border px-3 py-2.5 ${
              sel === i ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span className="text-xs font-medium opacity-80">
              {i === today ? 'Oggi' : ''}
              {profile.trainingDays?.includes(i) ? '🏋️' : ''}&nbsp;
            </span>
            <span className="font-bold">{name.slice(0, 3)}</span>
          </button>
        ))}
      </div>

      <MacroSummary
        title={`${DAYS[sel]} · calorie del piano`}
        target={targets.perDay[sel]}
        actual={totals}
        note={targets.freeMeal && targets.freeMeal.day === sel ? `Pasto libero (~${targets.freeMeal.kcal} kcal) escluso dai totali.` : undefined}
      />

      <button
        className="btn-ghost w-full text-sm"
        onClick={() => {
          if (confirm(`Rendere ${DAYS[sel]} uguale a ${DAYS[(sel + 6) % 7]} (stessi alimenti, grammature adattate)?`)) copyFromPreviousDay(sel);
        }}
      >
        📋 Uguale a {DAYS[(sel + 6) % 7].toLowerCase()}
      </button>

      <MammaButton onClick={() => setShare('day')} label={`Invia Pranzo e Cena di ${DAYS[sel]} a Mamma`} />
      <button className="btn-soft w-full" onClick={() => setShare('week')}>
        📅 Invia il riepilogo di tutta la settimana
      </button>

      {day.meals.map((m) => (
        <MealCard key={`${sel}-${m.key}`} meal={m} dayIndex={sel} compact onRepeat={() => repeatMealAllWeek(sel, m.key)} />
      ))}

      <ShareSheet
        open={share !== null}
        onClose={() => setShare(null)}
        title={share === 'week' ? 'Settimana per Mamma' : `${DAYS[sel]} per Mamma`}
        text={share === 'week' ? weekMessage(plan.days) : share === 'day' ? dayMessage(day, sel, profile, targets.perDay[sel], sel === today) : ''}
      />
    </div>
  );
}
