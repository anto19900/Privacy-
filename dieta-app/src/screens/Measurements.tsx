import { Camera, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { navyBodyFat, waistToHeight } from '../lib/body';
import { toTime } from '../lib/forecast';
import { fmt1, fmtDate, isoDate } from '../lib/format';
import { downscale, getPhoto, savePhoto } from '../lib/photos';
import { useStore } from '../lib/store';
import type { Measurement } from '../lib/types';

type Field = 'waist' | 'hips' | 'neck' | 'chest' | 'arm' | 'thigh';
const FIELDS: { key: Field; label: string; hint: string; main?: boolean }[] = [
  { key: 'waist', label: 'Vita', hint: "all'altezza dell'ombelico", main: true },
  { key: 'hips', label: 'Fianchi', hint: 'nel punto più largo', main: true },
  { key: 'neck', label: 'Collo', hint: 'sotto il pomo d’Adamo (per la % di grasso)', main: true },
  { key: 'chest', label: 'Petto', hint: "all'altezza dei capezzoli" },
  { key: 'arm', label: 'Braccio', hint: 'bicipite rilassato' },
  { key: 'thigh', label: 'Coscia', hint: 'punto più largo' },
];

const parse = (s: string) => {
  const n = parseFloat(s.trim().replace(',', '.'));
  return n > 10 && n < 300 ? Math.round(n * 10) / 10 : undefined;
};

export function Measurements() {
  const { measurements, saveMeasurement, removeMeasurement, profile } = useStore();
  const [date, setDate] = useState(isoDate());
  const [vals, setVals] = useState<Partial<Record<Field, string>>>({});
  const [more, setMore] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  if (!profile) return null;

  const first = measurements.find((m) => m.waist);
  const last = [...measurements].reverse().find((m) => m.waist);
  const lastNeck = [...measurements].reverse().find((m) => m.neck)?.neck;
  const lastHips = [...measurements].reverse().find((m) => m.hips)?.hips;
  const bf = last?.waist ? navyBodyFat(profile.sex, profile.heightCm, last.waist, last.neck ?? lastNeck, last.hips ?? lastHips) : null;
  const firstBf = first?.waist ? navyBodyFat(profile.sex, profile.heightCm, first.waist, first.neck ?? lastNeck, first.hips ?? lastHips) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const m: Measurement = { date, photoId: measurements.find((x) => x.date === date)?.photoId };
    let any = false;
    for (const f of FIELDS) {
      const v = vals[f.key] ? parse(vals[f.key]!) : undefined;
      if (v !== undefined) {
        m[f.key] = v;
        any = true;
      }
    }
    if (photo) {
      const id = `foto-${date}`;
      try {
        await savePhoto(id, photo);
        m.photoId = id;
        any = true;
      } catch {
        setErr('Impossibile salvare la foto.');
        return;
      }
    }
    if (!any) {
      setErr('Inserisci almeno una misura o una foto.');
      return;
    }
    const prev = measurements.find((x) => x.date === date);
    saveMeasurement({ ...prev, ...m });
    setVals({});
    setPhoto(null);
    setErr(null);
  };

  const chart = measurements.filter((m) => m.waist || m.hips).map((m) => ({ t: toTime(m.date), vita: m.waist, fianchi: m.hips }));
  const diff = (a?: number, b?: number) => (a !== undefined && b !== undefined ? b - a : undefined);
  const signed = (n?: number, u = 'cm') => (n === undefined ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmt1(Math.abs(n))} ${u}`);

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => void submit(e)} className="card space-y-3">
        <label className="block">
          <span className="label">Data</span>
          <input type="date" className="input" value={date} max={isoDate()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {FIELDS.filter((f) => f.main || more).map((f) => (
            <label key={f.key} className="block">
              <span className="label">{f.label} (cm)</span>
              <input
                className="input px-3 text-lg font-semibold"
                inputMode="decimal"
                placeholder={fmt1([...measurements].reverse().find((m) => m[f.key])?.[f.key] ?? 0).replace(/^0$/, '')}
                value={vals[f.key] ?? ''}
                onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-emerald-700" onClick={() => setMore(!more)}>
          {more ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {more ? 'Meno misure' : 'Petto, braccio, coscia'}
        </button>
        <label className="btn-soft w-full cursor-pointer">
          <Camera size={20} /> {photo ? 'Foto pronta ✓ (cambia)' : 'Aggiungi foto (facoltativa)'}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setPhoto(await downscale(f).catch(() => null));
              e.target.value = '';
            }}
          />
        </label>
        {photo && <img src={photo} alt="Anteprima" className="mx-auto max-h-48 rounded-xl" />}
        {err && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
        <button type="submit" className="btn-primary w-full">
          <Plus size={20} /> Salva misure
        </button>
        <p className="text-xs text-slate-400">Misura sempre alla stessa ora (meglio al mattino), metro aderente ma non stretto.</p>
      </form>

      {last && (
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Vita" value={`${fmt1(last.waist!)} cm`} sub={first && first !== last ? `${signed(diff(first.waist, last.waist))} dall'inizio` : undefined} />
          <Stat label="Vita / altezza" value={fmt1(waistToHeight(last.waist!, profile.heightCm) * 100) + '%'} sub="ideale sotto il 50%" />
          {bf !== null && (
            <Stat label="% grasso stimata" value={`${fmt1(bf)}%`} sub={firstBf !== null && first !== last ? `${signed(bf - firstBf, 'punti')} dall'inizio` : 'formula US Navy'} />
          )}
          {lastHips !== undefined && <Stat label="Fianchi" value={`${fmt1(lastHips)} cm`} />}
        </div>
      )}
      {last && bf === null && (
        <p className="text-xs text-slate-500">
          Aggiungi il collo{profile.sex === 'F' ? ' e i fianchi' : ''} per stimare la % di grasso corporeo.
        </p>
      )}

      {chart.length >= 2 && (
        <div className="card px-1 pb-2">
          <h2 className="px-3 pb-2 font-bold text-slate-800">Andamento circonferenze</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e3ede6" />
                <XAxis
                  dataKey="t"
                  type="number"
                  scale="time"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(t: number) => new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  labelFormatter={(t: number) => new Date(t).toLocaleDateString('it-IT')}
                  formatter={(v: number, n: string) => [`${fmt1(v)} cm`, n === 'vita' ? 'Vita' : 'Fianchi']}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Legend formatter={(v: string) => (v === 'vita' ? 'Vita' : 'Fianchi')} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="vita" stroke="#059669" strokeWidth={3} connectNulls dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fianchi" stroke="#f59e0b" strokeWidth={2} connectNulls dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <PhotoCompare items={measurements.filter((m) => m.photoId)} />

      <div className="card">
        <h2 className="mb-2 font-bold text-slate-800">Storico misure</h2>
        {measurements.length === 0 && <p className="text-slate-500">Nessuna misura registrata. Quando la bilancia si ferma, la vita spesso continua a scendere!</p>}
        <ul className="divide-y divide-slate-100">
          {[...measurements].reverse().map((m) => (
            <li key={m.date} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="text-sm text-slate-600">{fmtDate(m.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p className="text-sm font-semibold text-slate-800">
                  {FIELDS.filter((f) => m[f.key]).map((f) => `${f.label} ${fmt1(m[f.key]!)}`).join(' · ') || '—'}
                  {m.photoId ? ' · 📷' : ''}
                </p>
              </div>
              <button className="rounded-lg p-2 text-slate-400 active:bg-rose-50 active:text-rose-600" aria-label="Elimina" onClick={() => confirm('Eliminare queste misure?') && removeMeasurement(m.date)}>
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Confronto fotografico: prima vs dopo, con date selezionabili. */
function PhotoCompare({ items }: { items: Measurement[] }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.max(0, items.length - 1));
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => setB(Math.max(0, items.length - 1)), [items.length]);
  useEffect(() => {
    let alive = true;
    void Promise.all(items.map(async (m) => [m.photoId!, (await getPhoto(m.photoId!).catch(() => undefined)) ?? ''] as const)).then((pairs) => {
      if (alive) setUrls(Object.fromEntries(pairs));
    });
    return () => {
      alive = false;
    };
  }, [items]);
  if (items.length === 0) return null;

  const Pane = ({ idx, set }: { idx: number; set: (n: number) => void }) => {
    const m = items[Math.min(idx, items.length - 1)];
    return (
      <div className="space-y-1.5">
        {urls[m.photoId!] ? (
          <img src={urls[m.photoId!]} alt={m.date} className="aspect-[3/4] w-full rounded-xl object-cover" />
        ) : (
          <div className="aspect-[3/4] w-full rounded-xl bg-slate-100" />
        )}
        <select className="input py-2 text-sm" value={idx} onChange={(e) => set(Number(e.target.value))}>
          {items.map((x, i) => (
            <option key={x.date} value={i}>
              {fmtDate(x.date, { day: 'numeric', month: 'short', year: '2-digit' })}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="card">
      <h2 className="mb-3 font-bold text-slate-800">📷 Confronto foto</h2>
      {items.length === 1 ? (
        <p className="text-sm text-slate-500">Aggiungi un'altra foto più avanti (stessa posa e luce) per vedere il prima/dopo.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Pane idx={a} set={setA} />
          <Pane idx={b} set={setB} />
        </div>
      )}
      <p className="mt-2 text-xs text-slate-400">Le foto restano solo su questo telefono (e nel backup, se scegli di includerle).</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
