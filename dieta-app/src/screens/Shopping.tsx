import { Plus, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ShareSheet } from '../components/ShareSheet';
import { DEPARTMENTS } from '../lib/foods';
import { shoppingMessage } from '../lib/messages';
import { buildShopping } from '../lib/shopping';
import { useStore } from '../lib/store';

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'}`}>
      {checked && '✓'}
    </span>
  );
}

export function Shopping() {
  const { plan, shopping, toggleItem, toggleExtra, addExtra, removeExtra, resetChecks } = useStore();
  const [newItem, setNewItem] = useState('');
  const [share, setShare] = useState(false);
  const groups = useMemo(() => (plan ? buildShopping(plan, shopping.checked) : []), [plan, shopping.checked]);
  if (!plan) return null;

  const all = groups.flatMap((g) => g.items);
  const done = all.filter((i) => i.checked).length + shopping.extras.filter((e) => e.checked).length;
  const total = all.length + shopping.extras.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    addExtra(name);
    setNewItem('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">Lista della spesa</h1>
        <button className="rounded-xl p-3 text-slate-500 active:bg-slate-100" aria-label="Azzera spunte" onClick={resetChecks}>
          <RotateCcw size={22} />
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between text-sm font-medium text-slate-600">
          <span>Nel carrello</span>
          <span>{done} / {total}</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100">
          <div className="h-2.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Quantità totali per 7 giorni, aggiornate con i tuoi cambi.</p>
      </div>

      <button className="btn-primary w-full" onClick={() => setShare(true)}>
        <Share2 size={20} /> Condividi lista
      </button>

      {groups.map((g) => (
        <section key={g.department} className="card p-0 overflow-hidden">
          <h2 className="bg-sage-100 px-4 py-2.5 font-bold text-sage-800">
            {DEPARTMENTS[g.department].emoji} {DEPARTMENTS[g.department].label}
          </h2>
          <ul>
            {g.items.map((i) => (
              <li key={i.foodId}>
                <button onClick={() => toggleItem(i.foodId)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left active:bg-emerald-50">
                  <Checkbox checked={i.checked} />
                  <span className="text-xl">{i.emoji}</span>
                  <span className={`flex-1 ${i.checked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{i.name}</span>
                  <span className={`font-bold ${i.checked ? 'text-slate-400' : 'text-emerald-700'}`}>{i.qty}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

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

      <ShareSheet open={share} onClose={() => setShare(false)} title="Condividi lista della spesa" text={shoppingMessage(groups, shopping.extras)} />
    </div>
  );
}
