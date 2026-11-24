import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Measurements } from './Measurements';
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { estimateAdaptive, MIN_DAYS, movingAverage } from '../lib/adaptive';
import { buildForecast, toTime } from '../lib/forecast';
import { fmt1, fmtDate, isoDate } from '../lib/format';
import { bmiLabel, bmiTone, calcBmi } from '../lib/nutrition';
import { useStore } from '../lib/store';

function WeightView() {
  const { weights, profile, targets, plan, foodLog, addWeight, removeWeight, applyKcalAdjust } = useStore();
  const [date, setDate] = useState(isoDate());
  const [kg, setKg] = useState('');
  if (!profile || !targets || !plan) return null;

  const first = weights[0];
  const last = weights[weights.length - 1];
  const current = last?.kg ?? profile.weightKg;
  const start = first?.kg ?? profile.weightKg;
  const delta = current - start;
  const toGoal = current - profile.goalWeightKg;
  const bmi = calcBmi(current, profile.heightCm);

  const ma = movingAverage(weights);
  const trend = ma[ma.length - 1];
  // la previsione parte dalla media mobile: meno sensibile alle oscillazioni del singolo giorno
  const forecast = buildForecast(trend ? [{ date: trend.date, kg: trend.avg }] : [], profile.weightKg, profile.goalWeightKg, targets.weeklyChangeKg);
  const estimate = estimateAdaptive(weights, foodLog, plan, targets, profile);

  // serie unica per Recharts: "kg" = pesate, "media" = media 7 giorni, "previsto" = proiezione
  type Row = { t: number; kg?: number; media?: number; previsto?: number };
  const rows = new Map<number, Row>();
  weights.forEach((w) => rows.set(toTime(w.date), { t: toTime(w.date), kg: w.kg }));
  ma.forEach((m) => rows.set(m.t, { ...(rows.get(m.t) ?? { t: m.t }), media: m.avg }));
  forecast.points.forEach((f) => rows.set(f.t, { ...(rows.get(f.t) ?? { t: f.t }), previsto: f.kg }));
  const data = [...rows.values()].sort((a, b) => a.t - b.t);

  const values = [...weights.map((w) => w.kg), ...forecast.points.map((f) => f.kg), profile.goalWeightKg];
  const yMin = Math.floor(Math.min(...values) - 1);
  const yMax = Math.ceil(Math.max(...values) + 1);
  const fmtTick = (t: number) => new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  const tMin = data.length ? data[0].t : 0;
  const tMax = data.length ? data[data.length - 1].t : 0;
  const ticks = tMax > tMin ? [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(tMin + k * (tMax - tMin))) : undefined;
  const showChart = weights.length >= 2 || (weights.length >= 1 && forecast.points.length > 0);

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
        <Stat label="Peso attuale" value={`${fmt1(current)} kg`} sub={trend ? `media 7 gg: ${fmt1(trend.avg)} kg` : undefined} accent />
        <Stat label="Variazione totale" value={signed(delta)} tone={delta < 0 ? 'good' : delta > 0 ? 'warn' : undefined} />
        <Stat label="All'obiettivo" value={Math.abs(toGoal) < 0.05 ? 'Raggiunto! 🎉' : `${fmt1(Math.abs(toGoal))} kg`} sub={`obiettivo ${fmt1(profile.goalWeightKg)} kg`} />
        <div className="card col-span-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">BMI attuale</p>
            <p className="text-2xl font-bold text-slate-800">{fmt1(bmi)}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${bmiTone(bmi)}`}>{bmiLabel(bmi)}</span>
        </div>
      </div>

      <div className="card px-1 pb-2">
        <h2 className="px-3 pb-2 font-bold text-slate-800">Andamento</h2>
        {!showChart ? (
          <p className="px-3 py-8 text-center text-slate-500">Registra almeno due pesate per vedere il grafico.</p>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3ede6" />
                <XAxis dataKey="t" type="number" scale="time" domain={['dataMin', 'dataMax']} ticks={ticks} tickFormatter={fmtTick} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis domain={[yMin, yMax]} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(t: number) => new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  formatter={(v: number, name: string) => [`${fmt1(v)} kg`, name === 'kg' ? 'Pesata' : name === 'media' ? 'Media 7 gg' : 'Previsto']}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Legend formatter={(v: string) => (v === 'kg' ? 'Pesate' : v === 'media' ? 'Media 7 giorni' : 'Previsione')} wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={profile.goalWeightKg} stroke="#f43f5e" strokeDasharray="6 4" label={{ value: 'Obiettivo', position: 'insideTopRight', fill: '#f43f5e', fontSize: 11 }} />
                <Line type="linear" dataKey="kg" stroke="#6ee7b7" strokeWidth={1.5} dot={{ r: 3, fill: '#6ee7b7' }} activeDot={{ r: 5 }} connectNulls />
                <Line type="monotone" dataKey="media" stroke="#047857" strokeWidth={3} dot={false} connectNulls />
                {forecast.points.length > 0 && (
                  <Line type="linear" dataKey="previsto" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="px-3 pt-2 text-sm text-slate-600">
          {forecast.goalDate && forecast.weeks ? (
            <p className="rounded-xl bg-emerald-50 p-3">
              🔮 Con <b>{targets.kcal} kcal/giorno</b> ({targets.weeklyChangeKg < 0 ? '−' : '+'}
              {fmt1(Math.abs(targets.weeklyChangeKg))} kg/settimana) raggiungerai <b>{fmt1(profile.goalWeightKg)} kg</b> in circa{' '}
              <b>{forecast.weeks} settimane</b>, verso il{' '}
              <b>{forecast.goalDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</b>.
            </p>
          ) : Math.abs(toGoal) >= 0.05 ? (
            <p className="rounded-xl bg-slate-50 p-3">Con l'obiettivo attuale ({profile.goal}) non è prevista una variazione verso il peso obiettivo: modifica obiettivo o ritmo nel Profilo.</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-400">
            La media 7 giorni smussa le oscillazioni dovute ad acqua e sale. Previsione teorica lineare (1 kg ≈ 7.700 kcal) a partire dalla media.
          </p>
        </div>
      </div>

      <AdaptiveCard
        estimate={estimate}
        weighIns={weights.length}
        kcal={targets.kcal}
        adjust={profile.kcalAdjust ?? 0}
        onApply={(delta) => {
          if (confirm(`Portare le calorie a ${targets.kcal + delta} kcal/giorno e rigenerare il piano della settimana?`)) applyKcalAdjust(delta);
        }}
        onReset={() => {
          if (confirm('Tornare alle calorie calcolate con la formula e rigenerare il piano?')) applyKcalAdjust(-(profile.kcalAdjust ?? 0));
        }}
      />

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

function AdaptiveCard({ estimate: e, weighIns, kcal, adjust, onApply, onReset }: {
  estimate: ReturnType<typeof estimateAdaptive>;
  weighIns: number;
  kcal: number;
  adjust: number;
  onApply: (delta: number) => void;
  onReset: () => void;
}) {
  const rate = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt1(Math.abs(n))} kg/sett.`;
  return (
    <div className="card space-y-3">
      <div>
        <h2 className="font-bold text-slate-800">🧠 Il tuo metabolismo reale</h2>
        <p className="text-xs text-slate-500">Confronta quanto mangi con come cambia davvero il peso.</p>
      </div>
      {!e ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Servono almeno <b>4 pesate</b> distribuite su <b>{MIN_DAYS} giorni</b> (ultime 4 settimane). Pesate registrate: {weighIns}. Più pasti
          segni nel diario, più la stima sarà precisa.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">TDEE da formula</p>
              <p className="text-lg font-bold text-slate-700">{e.formulaTdee}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <p className="text-xs text-slate-500">TDEE reale stimato</p>
              <p className="text-lg font-extrabold text-emerald-700">{e.realTdee}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">Ritmo reale</p>
              <p className="text-lg font-bold text-slate-700">{rate(e.observedWeeklyKg)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <p className="text-xs text-slate-500">Ritmo voluto</p>
              <p className="text-lg font-bold text-slate-700">{rate(e.expectedWeeklyKg)}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Basato su {e.weighIns} pesate in {e.days} giorni · calorie medie {e.avgIntake} kcal ({e.loggedDays} giorni con diario completo, gli altri
            stimati dal piano).
          </p>
          {Math.abs(e.delta) < 50 ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">✅ Sei in linea: le calorie attuali ({kcal} kcal) vanno bene così.</p>
          ) : (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p>
                {e.delta < 0 ? '📉' : '📈'} Per tenere il ritmo voluto ti suggeriamo <b>{e.suggestedKcal} kcal/giorno</b> ({e.delta > 0 ? '+' : '−'}
                {Math.abs(e.delta)} kcal).
              </p>
              <button className="btn-primary mt-2 w-full" onClick={() => onApply(e.delta)}>
                Applica {e.suggestedKcal} kcal e rigenera il piano
              </button>
            </div>
          )}
        </>
      )}
      {adjust !== 0 && (
        <div className="flex items-center justify-between rounded-xl bg-sky-50 p-3 text-sm text-sky-800">
          <span>
            Correzione attiva: {adjust > 0 ? '+' : '−'}
            {Math.abs(adjust)} kcal
          </span>
          <button className="font-semibold underline" onClick={onReset}>
            Ripristina
          </button>
        </div>
      )}
    </div>
  );
}

export function Weight() {
  const [tab, setTab] = useState<'peso' | 'misure'>('peso');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-slate-900">I miei progressi</h1>
      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(['peso', 'misure'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl py-2.5 text-sm font-bold ${tab === t ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}>
            {t === 'peso' ? '⚖️ Peso' : '📏 Misure e foto'}
          </button>
        ))}
      </div>
      {tab === 'peso' ? <WeightView /> : <Measurements />}
    </div>
  );
}
