import { Home, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ShareSheet } from '../components/ShareSheet';
import { DEPARTMENTS } from '../lib/foods';
import { shoppingMessage } from '../lib/messages';
import { buildShopping, SPLIT_LABEL, type ShopMode, type ShoppingRow } from '../lib/shopping';
import { useStore } from '../lib/store';

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}
    >
      {checked && '✓'}
    </span>
  );
}

export function Shopping() {
  const { plan, shopping, pantry, toggleItem, togglePantry, toggleExtra, addExtra, removeExtra, resetChecks, setShopping } = useStore();
  const [newItem, setNewItem] = useState('');
  const [share, setShare] = useState(false);
  const [mode, setMode] = useState<ShopMode>(shopping.split ? 'a' : 'week');
  const { groups, pantryRows } = useMemo(
    () => (plan ? buildShopping(plan, shopping.checked, mode, pantry) : { groups: [], pantryRows: [] }),
    [plan, shopping.checked, mode, pantry],
  );
  if (!plan) return null;

  const all = groups.flatMap((g) => g.items);
  const showExtras = mode !== 'b';
  const extras = showExtras ? shopping.extras : [];
  const done = all.filter((i) => i.checked).length + extras.filter((e) => e.checked).length;
  const total = all.length + extras.length;

  const setSplit = (split: boolean) => {
    setShopping((s) => ({ ...s, split }));
    setMode(split ? 'a' : 'week');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    addExtra(name);
    setNewItem('');
  };

  const Row = ({ i, inPantry }: { i: ShoppingRow; inPantry?: boolean }) => (
    <li className="flex items-center border-b border-slate-100 last:border-0">
      {inPantry ? (
        <div className="flex flex-1 items-center gap-3 px-4 py-3 text-slate-400">
          <span className="text-xl">{i.emoji}</span>
          <span className="flex-1">{i.name}</span>
          <span className="text-xs">serve {i.need}</span>
        </div>
      ) : (
        <button onClick={() => toggleItem(i.key)} className="flex flex-1 items-center gap-3 py-3 pl-4 text-left active:bg-emerald-50">
          <Checkbox checked={i.checked} />
          <span className="text-xl">{i.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className={`block ${i.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{i.name}</span>
            <span className={`block text-sm font-bold ${i.checked ? 'text-slate-400' : 'text-emerald-700'}`}>{i.qty}</span>
            <span className="block text-xs text-slate-400">serve {i.need}</span>
          </span>
        </button>
      )}
      <button
        onClick={() => togglePantry(i.foodId)}
        className={`mx-2 rounded-lg p-2.5 ${inPantry ? 'bg-sky-100 text-sky-700' : 'text-slate-400 active:bg-sky-50'}`}
        aria-label={inPantry ? 'Togli dalla dispensa' : 'Ce l\'ho già in dispensa'}
        title={inPantry ? 'Togli dalla dispensa' : "Ce l'ho già"}
      >
        <Home size={18} />
      </button>
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Lista della spesa</h1>
        <button className="rounded-xl p-3 text-slate-500 active:bg-slate-100" aria-label="Azzera spunte" onClick={resetChecks}>
          <RotateCcw size={22} />
        </button>
      </div>

      <div className="card space-y-3">
        <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setSplit(!shopping.split)}>
          <div>
            <p className="font-semibold text-slate-800">Dividi in due spese</p>
            <p className="text-xs text-slate-500">Lun–Gio e Ven–Dom: verdura e carne più fresche</p>
          </div>
          <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${shopping.split ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`h-6 w-6 rounded-full bg-white shadow transition ${shopping.split ? 'translate-x-6' : ''}`} />
          </span>
        </button>
        {shopping.split && (
          <div className="grid grid-cols-2 gap-2">
            {(['a', 'b'] as const).map((m) => (
              <button key={m} className={mode === m ? 'chip-on' : 'chip-off'} onClick={() => setMode(m)}>
                {SPLIT_LABEL[m]}
              </button>
            ))}
          </div>
        )}
        <div>
          <div className="flex justify-between text-sm font-medium text-slate-600">
            <span>Nel carrello</span>
            <span>
              {done} / {total}
            </span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-100">
            <div className="h-2.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
        <p className="text-xs text-slate-500">Quantità arrotondate alle confezioni del supermercato. Tocca 🏠 per ciò che hai già in dispensa.</p>
      </div>

      <button className="btn-primary w-full" onClick={() => setShare(true)}>
        <Share2 size={20} /> Condividi lista
      </button>

      {groups.map((g) => (
        <section key={g.department} className="card overflow-hidden p-0">
          <h2 className="bg-sage-100 px-4 py-2.5 font-bold text-sage-800">
            {DEPARTMENTS[g.department].emoji} {DEPARTMENTS[g.department].label}
          </h2>
          <ul>
            {g.items.map((i) => (
              <Row key={i.key} i={i} />
            ))}
          </ul>
        </section>
      ))}

      {showExtras && (
        <section className="card space-y-3">
          <h2 className="font-bold text-slate-800">➕ Voci extra</h2>
          <form onSubmit={submit} className="flex gap-2">
            <input className="input" placeholder="Es. detersivo, caffè…" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
            <button type="submit" className="btn-primary px-4" aria-label="Aggiungi">
              <Plus />
            </button>
          </form>
          <ul>
            {shopping.extras.map((e) => (
              <li key={e.id} className="flex items-center gap-2 border-b border-slate-100 py-1 last:border-0">
                <button className="flex flex-1 items-center gap-3 py-2 text-left" onClick={() => toggleExtra(e.id)}>
                  <Checkbox checked={e.checked} />
                  <span className={e.checked ? 'text-slate-400 line-through' : 'text-slate-800'}>{e.name}</span>
                </button>
                <button className="rounded-lg p-2 text-slate-400 active:bg-rose-50 active:text-rose-600" aria-label="Elimina" onClick={() => removeExtra(e.id)}>
                  <Trash2 size={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pantryRows.length > 0 && (
        <section className="card overflow-hidden p-0">
          <h2 className="bg-sky-50 px-4 py-2.5 font-bold text-sky-800">🏠 Già in dispensa (non in lista)</h2>
          <ul>
            {pantryRows.map((i) => (
              <Row key={i.key} i={i} inPantry />
            ))}
          </ul>
        </section>
      )}

      <ShareSheet
        open={share}
        onClose={() => setShare(false)}
        title="Condividi lista della spesa"
        text={share ? shoppingMessage(groups, extras, mode === 'week' ? 'Lista della spesa' : `Lista della spesa · ${SPLIT_LABEL[mode]}`) : ''}
      />
    </div>
  );
}
