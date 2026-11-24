import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useState } from 'react';
import { exportCsv, exportJson, parseBackup } from '../lib/backup';
import { useStore } from '../lib/store';

export function BackupFields() {
  const { weights, measurements, importAll } = useStore();
  const [photos, setPhotos] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<void>, ok: string) => {
    try {
      await fn();
      setMsg({ ok: true, text: ok });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Operazione non riuscita.' });
    }
  };

  return (
    <div className="card space-y-3">
      <p className="text-sm text-slate-600">
        I dati stanno solo su questo telefono: se disinstalli l'app li perdi. Salva un backup su Drive, email o dove preferisci.
      </p>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={photos} onChange={(e) => setPhotos(e.target.checked)} />
        Includi le foto (file più grande)
      </label>
      <button className="btn-primary w-full" onClick={() => void run(() => exportJson(photos), 'Backup creato ✅')}>
        <Download size={20} /> Esporta backup completo
      </button>
      <label className="btn-ghost w-full cursor-pointer">
        <Upload size={20} /> Importa backup
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            await run(async () => {
              const data = parseBackup(await f.text());
              if (!confirm('Importare il backup? I dati attuali verranno sostituiti.')) throw new Error('Importazione annullata.');
              await importAll(data);
            }, 'Backup importato ✅');
          }}
        />
      </label>
      <button className="btn-soft w-full" onClick={() => void run(() => exportCsv(weights, measurements), 'CSV creato ✅')}>
        <FileSpreadsheet size={20} /> Esporta peso e misure (CSV per Excel)
      </button>
      {msg && <p className={`rounded-xl p-3 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'}`}>{msg.text}</p>}
    </div>
  );
}
