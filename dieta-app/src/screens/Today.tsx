import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MacroSummary } from '../components/MacroSummary';
import { MammaButton } from '../components/MammaButton';
import { MealCard } from '../components/MealCard';
import { ShareSheet } from '../components/ShareSheet';
import { TherapyCard } from '../components/Therapy';
import { dayTotals, effectiveDay, lastWeek, sumLogs, type DayStatus } from '../lib/diary';
import { isoDate } from '../lib/format';
import { dayMessage } from '../lib/messages';
import { DAYS, todayIndex } from '../lib/plan';
import { useStore } from '../lib/store';

export function Today({ onOpenWeek }: { onOpenWeek: () => void }) {
  const { plan, profile, targets, foodLog, logMeal } = useStore();
  const [share, setShare] = useState(false);
  const d = todayIndex();
  const iso = isoDate();
  const log = foodLog[iso];
  const day = useMemo(
    () => (plan && targets ? effectiveDay(plan.days[d], log, targets.perDay[d]) : null),
    [plan, targets, log, d],
  );
  if (!plan || !profile || !targets || !day) return null;

  const target = targets.perDay[d];
  const totals = dayTotals(day, log);
  const rebalanced = !!log && Object.values(log).some((l) => l && l.status !== 'done');
  const freeMeal = day.meals.find((m) => m.free);
  const eatenAll = sumLogs(log);
  const freeLog = freeMeal ? log?.[freeMeal.key] : undefined;
  const eaten = freeLog
    ? { kcal: eatenAll.kcal - freeLog.kcal, p: eatenAll.p - freeLog.p, c: eatenAll.c - freeLog.c, f: eatenAll.f - freeLog.f }
    : eatenAll;
  const loggedCount = Object.keys(log ?? {}).length;
  const date = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-emerald-700">
          {DAYS[d]} {date}
        </p>
        <h1 className="text-2xl font-extrabold text-slate-900">Ciao{profile.name ? ` ${profile.name.trim()}` : ''}! 👋</h1>
      </div>

      <TherapyCard />
      <MammaButton onClick={() => setShare(true)} />
      <MacroSummary
        title={rebalanced ? 'Totale di oggi (ribilanciato)' : 'Calorie del piano'}
        target={target}
        actual={totals}
        note={[
          loggedCount ? `Mangiato finora: ${Math.round(eaten.kcal)} kcal · P ${Math.round(eaten.p)}g · C ${Math.round(eaten.c)}g · G ${Math.round(eaten.f)}g.` : '',
          targets.freeMeal && targets.freeMeal.day === d ? `Oggi c'è il pasto libero (~${targets.freeMeal.kcal} kcal), escluso da questi totali.` : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      <Adherence />

      {day.meals.map((m) => (
        <MealCard
          key={m.key}
          meal={m}
          dayIndex={d}
          log={log?.[m.key]}
          onLog={(l) => logMeal(iso, m.key, l)}
          rebalanced={rebalanced}
        />
      ))}

      <button className="btn-ghost w-full" onClick={onOpenWeek}>
        <CalendarDays size={20} /> Vedi tutta la settimana
      </button>

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Menù di oggi per Mamma"
        text={share ? dayMessage(day, d, profile, target, true) : ''}
      />
    </div>
  );
}

const DOT: Record<DayStatus, { cls: string; label: string }> = {
  ok: { cls: 'bg-emerald-500 text-white', label: 'Nei macro' },
  off: { cls: 'bg-amber-400 text-white', label: 'Fuori target' },
  partial: { cls: 'bg-emerald-100 text-emerald-800', label: 'Incompleto' },
  none: { cls: 'bg-slate-100 text-slate-400', label: 'Non registrato' },
  future: { cls: 'bg-slate-50 text-slate-300', label: '' },
};

/** Aderenza degli ultimi 7 giorni, basata sul diario. */
function Adherence() {
  const { plan, targets, foodLog } = useStore();
  if (!plan || !targets) return null;
  const week = lastWeek(plan, targets, foodLog);
  const ok = week.filter((w) => w.status === 'ok').length;
  const any = week.some((w) => w.status !== 'none' && w.status !== 'future');

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">Aderenza ultimi 7 giorni</h2>
        <span className="text-sm font-bold text-emerald-700">{ok}/7 nei macro</span>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {week.map((w) => (
          <div key={w.date.toISOString()} className="flex flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500">{DAYS[todayIndex(w.date)].slice(0, 3)}</span>
            <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${DOT[w.status].cls}`} title={DOT[w.status].label}>
              {w.status === 'ok' ? '✓' : w.status === 'off' ? '!' : w.date.getDate()}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {any
          ? '✓ = tutti i pasti registrati, calorie entro ±10% e proteine ≥ 90% del target · ! = fuori target'
          : 'Segna ogni pasto come "Mangiato", "Altro" o "Saltato": i pasti rimasti si ribilanciano e qui vedrai la tua costanza.'}
      </p>
    </div>
  );
}
