import { ArrowLeftRight, Ban, Check, CircleSlash, Lock, Minus, PencilLine, Plus, Repeat, Search, Star, Trash2, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { logDone, logOther, logSkipped, mealMacros } from '../lib/diary';
import { getFood } from '../lib/foods';
import { fmtQty } from '../lib/format';
import { ADDABLE, allowedInCluster, alternativesDetailed, macroWarnings, CLUSTER_LABEL, dayItems, MEALS, setQuantity as previewQuantity, sumMacros } from '../lib/plan';
import { useStore } from '../lib/store';
import type { Cluster, DayPlan, MacroTarget, Meal, MealItem, MealKey, MealLog, Profile } from '../lib/types';
import { Sheet } from './Sheet';

interface Props {
  meal: Meal;
  dayIndex: number;
  compact?: boolean;
  /** se presente, mostra i pulsanti del diario (solo per oggi) */
  log?: MealLog;
  onLog?: (log: MealLog | null) => void;
  /** il giorno è stato ribilanciato rispetto al piano */
  rebalanced?: boolean;
  /** mostra "ripeti questo pasto tutta la settimana" */
  onRepeat?: () => void;
}

const STATUS = {
  done: { label: 'Mangiato', cls: 'bg-emerald-100 text-emerald-800', Icon: Check },
  other: { label: 'Mangiato altro', cls: 'bg-amber-100 text-amber-800', Icon: PencilLine },
  skipped: { label: 'Saltato', cls: 'bg-slate-200 text-slate-700', Icon: CircleSlash },
} as const;

export function MealCard({ meal, dayIndex, compact, log, onLog, rebalanced, onRepeat }: Props) {
  const { profile, plan, targets, swap, toggleFavorite, banFood, setQuantity, addFood, removeFood } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [qtyEdit, setQtyEdit] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const info = MEALS[meal.key];
  const visible = meal.items.map((it, i) => ({ it, i })).filter(({ it }) => it.grams > 0);
  const tot = sumMacros(meal.items);
  const freeKcal = targets?.freeMeal?.kcal ?? 900;
  const current: MealItem | null = editing !== null ? meal.items[editing] ?? null : null;
  const day = plan?.days[dayIndex];
  const planIndex = current && day ? day.meals.find((m) => m.key === meal.key)?.items.findIndex((x) => x.foodId === current.foodId) ?? -1 : -1;
  const alts = useMemo(
    () =>
      planIndex >= 0 && day && profile && targets ? alternativesDetailed(day, meal.key, planIndex, profile, targets.perDay[dayIndex]) : [],
    [planIndex, day, profile, targets, meal.key, dayIndex],
  );
  const locked = !!log;
  const plannedKcal = meal.free ? freeKcal : Math.round(mealMacros(meal).kcal);
  const st = log ? STATUS[log.status] : null;

  const diaryBar = onLog && (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {log && st ? (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${st.cls}`}>
            <st.Icon size={16} /> {st.label}
            {log.status !== 'skipped' && ` · ${Math.round(log.kcal)} kcal`}
          </span>
          <button className="ml-auto flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-slate-500 active:bg-slate-100" onClick={() => onLog(null)}>
            <Undo2 size={16} /> Annulla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button className="btn bg-emerald-600 px-2 text-sm text-white active:bg-emerald-700" onClick={() => onLog(logDone(meal, freeKcal))}>
            <Check size={18} /> Mangiato
          </button>
          <button className="btn border border-amber-200 bg-amber-50 px-2 text-sm text-amber-800" onClick={() => setOtherOpen(true)}>
            <PencilLine size={18} /> Altro
          </button>
          <button className="btn border border-slate-200 bg-white px-2 text-sm text-slate-600" onClick={() => onLog(logSkipped())}>
            <CircleSlash size={18} /> Saltato
          </button>
        </div>
      )}
    </div>
  );

  const otherSheet = onLog && (
    <OtherSheet
      open={otherOpen}
      plannedKcal={plannedKcal}
      title={info.label}
      onClose={() => setOtherOpen(false)}
      onSave={(kcal) => {
        onLog(logOther(meal, kcal, freeKcal));
        setOtherOpen(false);
      }}
    />
  );

  if (meal.free) {
    return (
      <div className="card border-2 border-dashed border-amber-300 bg-amber-50/60">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <span className="text-xl">🍕</span> {info.label}: pasto libero
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Goditelo senza pesare nulla! Circa <b>{freeKcal} kcal</b>, già conteggiate nel bilancio settimanale: gli altri giorni
          sono leggermente ridotti per compensare.
        </p>
        {diaryBar}
        {otherSheet}
      </div>
    );
  }

  return (
    <div className={`card ${log?.status === 'skipped' ? 'opacity-60' : ''}`}>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-bold text-slate-800">
          <span className="text-xl">{info.emoji}</span> {info.label}
        </h3>
        <div className="flex items-center gap-1.5">
          {onRepeat && (
            <button
              className="rounded-full p-2 text-slate-500 active:bg-slate-100"
              aria-label="Ripeti in tutta la settimana"
              title="Ripeti in tutta la settimana"
              onClick={() => {
                if (confirm(`Mettere questo ${info.label.toLowerCase()} (stessi alimenti) in tutti i giorni della settimana?`)) onRepeat();
              }}
            >
              <Repeat size={18} />
            </button>
          )}
          <span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-sage-700">{Math.round(tot.kcal)} kcal</span>
        </div>
      </div>
      {rebalanced && !locked && (
        <p className="mb-1 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700">↻ Grammature ribilanciate in base a quanto hai già mangiato oggi</p>
      )}
      <ul className="divide-y divide-slate-100">
        {visible.map(({ it, i }) => {
          const f = getFood(it.foodId);
          return (
            <li key={i} className="flex items-center gap-3 py-2">
              <span className="text-2xl leading-none">{f.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-800">{f.name}</p>
                {locked ? (
                  <p className="text-sm font-semibold text-emerald-700">{fmtQty(it.foodId, it.grams)}</p>
                ) : (
                  <button
                    className="-mx-1 flex items-center gap-1 rounded-lg px-1 text-left text-sm font-semibold text-emerald-700 underline decoration-dotted underline-offset-4 active:bg-emerald-50"
                    onClick={() => setQtyEdit(i)}
                    aria-label={`Modifica quantità di ${f.name}`}
                  >
                    {it.locked && <Lock size={12} className="shrink-0" />}
                    {fmtQty(it.foodId, it.grams)}
                  </button>
                )}
              </div>
              {!locked && (
                <button
                  onClick={() => setEditing(i)}
                  className={`flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 font-semibold text-emerald-800 active:bg-emerald-100 ${
                    compact ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm'
                  }`}
                  aria-label={`Cambia ${f.name}`}
                >
                  <ArrowLeftRight size={16} /> Cambia
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {!locked && (
        <button className="mt-1 flex items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-semibold text-emerald-700 active:bg-emerald-50" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Aggiungi alimento
        </button>
      )}
      {addOpen && profile && (
        <AddSheet
          meal={meal}
          profile={profile}
          onClose={() => setAddOpen(false)}
          onAdd={(foodId, cluster) => {
            addFood(dayIndex, meal.key, foodId, cluster);
            setAddOpen(false);
          }}
        />
      )}
      {!compact && (
        <p className="mt-2 text-xs text-slate-500">
          P {Math.round(tot.p)}g · C {Math.round(tot.c)}g · G {Math.round(tot.f)}g
        </p>
      )}
      {diaryBar}
      {otherSheet}

      <Sheet
        open={current !== null}
        onClose={() => {
          setEditing(null);
          setQuery('');
        }}
        title="Alternative equivalenti"
        subtitle={current ? `${CLUSTER_LABEL[current.cluster]} · grammature ricalcolate per restare nei tuoi macro` : ''}
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
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`btn text-sm ${(profile?.favoriteFoods ?? []).includes(current.foodId) ? 'bg-amber-400 text-white' : 'border border-amber-200 bg-amber-50 text-amber-800'}`}
                onClick={() => toggleFavorite(current.foodId)}
              >
                <Star size={18} fill={(profile?.favoriteFoods ?? []).includes(current.foodId) ? 'currentColor' : 'none'} />
                {(profile?.favoriteFoods ?? []).includes(current.foodId) ? 'Preferito' : 'Più spesso'}
              </button>
              <button
                className="btn border border-rose-200 bg-rose-50 text-sm text-rose-700"
                onClick={() => {
                  const name = getFood(current.foodId).name;
                  if (confirm(`Non proporre mai più "${name}"? Verrà sostituito in tutta la settimana (puoi riattivarlo dal Profilo).`)) {
                    banFood(current.foodId);
                    setEditing(null);
                  }
                }}
              >
                <Ban size={18} /> Mai più
              </button>
            </div>
            <button
              className="btn w-full border border-slate-200 bg-white text-sm text-slate-600"
              onClick={() => {
                if (planIndex >= 0) removeFood(dayIndex, meal.key, planIndex);
                setEditing(null);
              }}
            >
              <Trash2 size={18} /> Togli dal pasto
            </button>
            <p className="pt-1 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">oppure</p>
            {alts.length > 6 && (
              <label className="relative block">
                <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder={`Cerca tra ${alts.length} alternative…`} value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
            )}
            {alts.length === 0 && <p className="text-center text-slate-500">Nessuna alternativa compatibile con le tue preferenze.</p>}
            {alts.length > 0 && (
              <p className="text-center text-xs text-slate-400">
                Scegliendo un'alternativa, le altre grammature del giorno si adattano leggermente per mantenere proteine, carboidrati e grassi.
              </p>
            )}
            {alts.filter((x) => !query || getFood(x.item.foodId).name.toLowerCase().includes(query.toLowerCase())).map(({ item: a, day: dm }) => {
              const f = getFood(a.foodId);
              const warn = targets ? macroWarnings(dm, targets.perDay[dayIndex]) : [];
              return (
                <button
                  key={a.foodId}
                  onClick={() => {
                    if (planIndex >= 0) swap(dayIndex, meal.key, planIndex, a.foodId);
                    setEditing(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left active:bg-emerald-50"
                >
                  <span className="text-2xl">{f.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-500">
                      {Math.round((f.kcal * a.grams) / 100)} kcal · P {Math.round((f.p * a.grams) / 100)} · C {Math.round((f.c * a.grams) / 100)} · G{' '}
                      {Math.round((f.f * a.grams) / 100)}
                    </p>
                    {warn.length > 0 ? (
                      <p className="mt-0.5 text-xs font-semibold text-amber-700">⚠ Il giorno esce dai macro: {warn.join(', ')}</p>
                    ) : (
                      <p className="mt-0.5 text-xs font-medium text-emerald-700">✓ il giorno resta nei macro</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-bold text-white ${warn.length ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                    {fmtQty(a.foodId, a.grams)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Sheet>

      {qtyEdit !== null && day && targets && meal.items[qtyEdit] && (
        <QuantitySheet
          item={meal.items[qtyEdit]}
          day={day}
          mealKey={meal.key}
          planIndex={day.meals.find((m) => m.key === meal.key)?.items.findIndex((x) => x.foodId === meal.items[qtyEdit].foodId) ?? -1}
          target={targets.perDay[dayIndex]}
          onClose={() => setQtyEdit(null)}
          onSave={(pi, grams) => {
            if (pi >= 0) setQuantity(dayIndex, meal.key, pi, grams);
            setQtyEdit(null);
          }}
        />
      )}
    </div>
  );
}

/** Modifica manuale della quantità con anteprima dei macro del giorno. */
function QuantitySheet({ item, day, mealKey, planIndex, target, onClose, onSave }: {
  item: MealItem; day: DayPlan; mealKey: MealKey; planIndex: number; target: MacroTarget;
  onClose: () => void; onSave: (planIndex: number, grams: number | null) => void;
}) {
  const f = getFood(item.foodId);
  const step = f.step;
  const [g, setG] = useState(item.grams);
  const [text, setText] = useState(String(Math.round(item.grams)));
  const setBoth = (n: number) => {
    const v = Math.max(step, Math.round(n * 10) / 10);
    setG(v);
    setText(String(Math.round(v)));
  };
  const preview = useMemo(() => {
    if (planIndex < 0) return null;
    return sumMacros(dayItems(previewQuantity(day, mealKey, planIndex, g, target)));
  }, [day, mealKey, planIndex, g, target]);
  const k = g / 100;
  const ok = (v: number, t: number) => Math.abs(v - t) <= Math.max(5, t * 0.08);
  const unitLabel = f.piece ? (f.piece.half ? `½ ${f.piece.singular}` : `1 ${f.piece.singular}`) : `${step} ${f.unit}`;

  return (
    <Sheet open onClose={onClose} title={f.name} subtitle="Scegli tu la quantità: gli altri alimenti del giorno si adattano per restare nei macro.">
      <div className="flex items-center justify-between gap-3">
        <button className="btn-ghost h-14 w-14 p-0" aria-label="Meno" onClick={() => setBoth(g - step)}>
          <Minus />
        </button>
        <div className="flex-1 text-center">
          <p className="text-xl font-extrabold text-slate-900">{fmtQty(item.foodId, g)}</p>
          <p className="text-xs text-slate-500">± {unitLabel} per tocco</p>
        </div>
        <button className="btn-ghost h-14 w-14 p-0" aria-label="Più" onClick={() => setBoth(g + step)}>
          <Plus />
        </button>
      </div>
      <label className="mt-3 flex items-center gap-2">
        <span className="text-sm text-slate-600">oppure</span>
        <input
          className="input w-28 py-2 text-center"
          inputMode="numeric"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/\D/g, '');
            setText(t);
            const n = parseInt(t, 10);
            if (n > 0) setG(n);
          }}
        />
        <span className="text-sm text-slate-600">{f.unit}</span>
      </label>
      <p className="mt-3 text-sm text-slate-600">
        Questo alimento: <b>{Math.round(f.kcal * k)} kcal</b> · P {Math.round(f.p * k)} · C {Math.round(f.c * k)} · G {Math.round(f.f * k)}
      </p>
      {preview && (
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-slate-700">Giorno dopo il ribilanciamento</p>
          <p className="text-slate-600">
            <span className={ok(preview.kcal, target.kcal) ? '' : 'font-bold text-amber-600'}>{Math.round(preview.kcal)}/{target.kcal} kcal</span> ·{' '}
            <span className={ok(preview.p, target.p) ? '' : 'font-bold text-amber-600'}>P {Math.round(preview.p)}/{target.p}</span> ·{' '}
            <span className={ok(preview.c, target.c) ? '' : 'font-bold text-amber-600'}>C {Math.round(preview.c)}/{target.c}</span> ·{' '}
            <span className={ok(preview.f, target.f) ? '' : 'font-bold text-amber-600'}>G {Math.round(preview.f)}/{target.f}</span>
          </p>
          {!(ok(preview.kcal, target.kcal) && ok(preview.p, target.p) && ok(preview.c, target.c) && ok(preview.f, target.f)) && (
            <p className="mt-1 text-xs text-amber-700">Con questa quantità il giorno non riesce a restare del tutto nei macro (in arancione).</p>
          )}
        </div>
      )}
      <button className="btn-primary mt-4 w-full" onClick={() => onSave(planIndex, g)}>
        <Lock size={18} /> Fissa questa quantità
      </button>
      {item.locked && (
        <button className="btn-ghost mt-2 w-full" onClick={() => onSave(planIndex, null)}>
          Torna automatica
        </button>
      )}
    </Sheet>
  );
}

/** "Ho mangiato altro": scelta rapida o calorie stimate a mano. */
function OtherSheet({ open, plannedKcal, title, onClose, onSave }: {
  open: boolean; plannedKcal: number; title: string; onClose: () => void; onSave: (kcal: number) => void;
}) {
  const [custom, setCustom] = useState('');
  const quick = [
    { label: 'Meno del previsto', sub: '~ metà', k: 0.5 },
    { label: 'Più o meno uguale', sub: 'stesse calorie', k: 1 },
    { label: 'Di più', sub: '~ +50%', k: 1.5 },
    { label: 'Molto di più', sub: '~ il doppio', k: 2 },
  ];
  const n = parseInt(custom, 10);
  return (
    <Sheet open={open} onClose={onClose} title={`${title}: mangiato altro`} subtitle={`Previsto: circa ${plannedKcal} kcal. I pasti rimasti di oggi si ribilanciano.`}>
      <div className="grid grid-cols-2 gap-2">
        {quick.map((q) => (
          <button key={q.k} className="rounded-2xl border border-slate-200 bg-white p-3 text-left active:bg-amber-50" onClick={() => onSave(Math.round(plannedKcal * q.k))}>
            <p className="font-semibold text-slate-800">{q.label}</p>
            <p className="text-xs text-slate-500">
              {q.sub} · {Math.round(plannedKcal * q.k)} kcal
            </p>
          </button>
        ))}
      </div>
      <p className="mb-1 mt-4 text-sm font-medium text-slate-600">Oppure inserisci le calorie stimate</p>
      <div className="flex gap-2">
        <input className="input" inputMode="numeric" placeholder="es. 650" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} />
        <button className="btn-primary px-5" disabled={!(n > 0)} onClick={() => n > 0 && onSave(n)}>
          Salva
        </button>
      </div>
    </Sheet>
  );
}

/** Aggiunge un alimento al pasto, scegliendo per categoria. */
function AddSheet({ meal, profile, onClose, onAdd }: { meal: Meal; profile: Profile; onClose: () => void; onAdd: (foodId: string, cluster: Cluster) => void }) {
  const cats = ADDABLE[meal.key];
  const [cat, setCat] = useState<Cluster>(cats[0]);
  const [q, setQ] = useState('');
  const inMeal = new Set(meal.items.map((i) => i.foodId));
  const foods = allowedInCluster(cat, profile).filter((f) => !inMeal.has(f.id) && (!q || f.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <Sheet open onClose={onClose} title={`Aggiungi a ${MEALS[meal.key].label.toLowerCase()}`} subtitle="Le altre quantità del giorno si adattano per restare nei macro.">
      <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {cats.map((c) => (
          <button key={c} className={`shrink-0 ${cat === c ? 'chip-on' : 'chip-off'}`} onClick={() => setCat(c)}>
            {CLUSTER_LABEL[c]}
          </button>
        ))}
      </div>
      <label className="relative mb-3 block">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-10" placeholder="Cerca…" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="space-y-2">
        {foods.length === 0 && <p className="text-center text-slate-500">Nessun alimento disponibile in questa categoria.</p>}
        {foods.map((f) => (
          <button key={f.id} onClick={() => onAdd(f.id, cat)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left active:bg-emerald-50">
            <span className="text-2xl">{f.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{f.name}</p>
              <p className="text-xs text-slate-500">
                per 100 {f.unit}: {f.kcal} kcal · P {f.p} · C {f.c} · G {f.f}
              </p>
            </div>
            <Plus className="text-emerald-600" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}
