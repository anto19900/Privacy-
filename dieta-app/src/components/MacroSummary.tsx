import type { MacroTarget } from '../lib/types';

interface Props {
  target: MacroTarget;
  actual?: { kcal: number; p: number; c: number; f: number };
  title?: string;
  note?: string;
}

function Bar({ label, value, target, color }: { label: string; value?: number; target: number; color: string }) {
  const pct = value !== undefined ? Math.min(100, (value / Math.max(target, 1)) * 100) : 100;
  const off = value !== undefined && Math.abs(value - target) > Math.max(5, target * 0.08);
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`text-sm font-bold ${off ? 'text-amber-600' : 'text-slate-800'}`}>
        {value !== undefined ? `${Math.round(value)}/` : ''}
        {target}g
      </p>
      <div className="mt-1 h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function MacroSummary({ target, actual, title, note }: Props) {
  return (
    <div className="card">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-slate-500">{title ?? (actual ? 'Calorie del piano' : 'Obiettivo giornaliero')}</p>
          <p className="text-3xl font-extrabold text-slate-900">
            {Math.round(actual?.kcal ?? target.kcal)}
            <span className="ml-1 text-base font-semibold text-slate-500">kcal</span>
          </p>
        </div>
        {actual && <p className="text-sm text-slate-500">target {target.kcal}</p>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Bar label="Proteine" value={actual?.p} target={target.p} color="bg-emerald-500" />
        <Bar label="Carboidrati" value={actual?.c} target={target.c} color="bg-amber-400" />
        <Bar label="Grassi" value={actual?.f} target={target.f} color="bg-sky-400" />
      </div>
      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
