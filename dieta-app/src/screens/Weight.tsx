import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt1, fmtDate, isoDate } from '../lib/format';
import { bmiLabel, calcBmi } from '../lib/nutrition';
import { useStore } from '../lib/store';

export function Weight() {
  const { weights, profile, addWeight, removeWeight } = useStore();
  const [date, setDate] = useState(isoDate());
  const [kg, setKg] = useState('');
  if (!profile) return null;

  const first = weights[0];
  const last = weights[weights.length - 1];
  const current = last?.kg ?? profile.weightKg;
  const start = first?.kg ?? profile.weightKg;
  const delta = current - start;
  const toGoal = current - profile.goalWeightKg;
  const bmi = calcBmi(current, profile.heightCm);

  const data = weights.map((w) => ({ date: w.date, label: fmtDate(w.date), kg: w.kg }));
  const values = [...weights.map((w) => w.kg), profile.goalWeightKg];
  const yMin = Math.floor(Math.min(...values) - 1);
  const yMax = Math.ceil(Math.max(...values) + 1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseFloat(kg.trim().replace(',', '.'));
    if (!(n >= 30 && n <= 300) || !date) return;
    addWeight(date, Math.round(n * 10) / 10);
    setKg('');
  };

  const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt1(Math.abs(n))} kg`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">Il mio peso</h1>

      <form onSubmit={submit} className="card space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Data</span>
            <input type="date" className="input" value={date} max={isoDate()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span className="label">Peso (kg)</span>
            <input type="text" inputMode="decimal" className="input text-lg font-semibold" placeholder={fmt1(current)} value={kg} onChange={(e) => setKg(e.target.value)} />
          </label>
        </div>
        <button type="submit" className="btn-primary w-full">
          <Plus size={20} /> Registra peso
        </button>
      </form>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Peso iniziale" value={`${fmt1(start)} kg`} />
        <Stat label="Peso attuale" value={`${fmt1(current)} kg`} accent />
        <Stat label="Variazione totale" value={signed(delta)} tone={delta < 0 ? 'good' : delta > 0 ? 'warn' : undefined} />
        <Stat label="All'obiettivo" value={Math.abs(toGoal) < 0.05 ? 'Raggiunto! 🎉' : `${fmt1(Math.abs(toGoal))} kg`} sub={`obiettivo ${fmt1(profile.goalWeightKg)} kg`} />
        <div className="card col-span-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">BMI attuale</p>
            <p className="text-2xl font-bold text-slate-800">{fmt1(bmi)}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{bmiLabel(bmi)}</span>
        </div>
      </div>

      <div className="card px-1 pb-2">
        <h2 className="px-3 pb-2 font-bold text-slate-800">Andamento</h2>
        {data.length < 2 ? (
          <p className="px-3 py-8 text-center text-slate-500">Registra almeno due pesate per vedere il grafico.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3ede6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval="preserveStartEnd" />
                <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${fmt1(v)} kg`, 'Peso']} labelStyle={{ color: '#334155' }} contentStyle={{ borderRadius: 12 }} />
                <ReferenceLine y={profile.goalWeightKg} stroke="#f43f5e" strokeDasharray="6 4" label={{ value: 'Obiettivo', position: 'insideTopRight', fill: '#f43f5e', fontSize: 11 }} />
                <Line type="monotone" dataKey="kg" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-2 font-bold text-slate-800">Storico</h2>
        {weights.length === 0 && <p className="text-slate-500">Nessuna pesata registrata.</p>}
        <ul className="divide-y divide-slate-100">
          {[...weights].reverse().map((w) => (
            <li key={w.date} className="flex items-center justify-between py-2.5">
              <span className="text-slate-600">{fmtDate(w.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-2">
                <b className="text-slate-800">{fmt1(w.kg)} kg</b>
                <button className="rounded-lg p-2 text-slate-400 active:bg-rose-50 active:text-rose-600" aria-label="Elimina pesata" onClick={() => removeWeight(w.date)}>
                  <Trash2 size={18} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, tone }: { label: string; value: string; sub?: string; accent?: boolean; tone?: 'good' | 'warn' }) {
  const color = tone === 'good' ? 'text-emerald-600' : tone === 'warn' ? 'text-amber-600' : accent ? 'text-emerald-700' : 'text-slate-800';
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
