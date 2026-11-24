import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ActivityFields, BasicFields, DEFAULT_PROFILE, GoalFields, PreferenceFields, validateBasics } from '../components/ProfileFields';
import { calcTargets, GOALS } from '../lib/nutrition';
import { fmt1 } from '../lib/format';
import { useStore } from '../lib/store';
import type { Profile } from '../lib/types';

const STEPS = ['I tuoi dati', 'Attività fisica', 'Obiettivo', 'Preferenze', 'Il tuo fabbisogno'];

export function Onboarding() {
  const { saveProfile } = useStore();
  const [step, setStep] = useState(-1);
  const [p, setP] = useState<Profile>(DEFAULT_PROFILE);
  const [error, setError] = useState<string | null>(null);

  if (step === -1) {
    return (
      <div className="flex min-h-full flex-col justify-between bg-gradient-to-b from-emerald-600 to-emerald-800 p-6 pt-[calc(3rem+env(safe-area-inset-top))] text-white">
        <div>
          <p className="text-6xl">🥗</p>
          <h1 className="mt-6 text-4xl font-extrabold leading-tight">Dieta &amp; Spesa</h1>
          <p className="mt-3 text-lg text-emerald-50">
            Il tuo piano settimanale semplice, la lista della spesa automatica e il menù da mandare a mamma in un tocco.
          </p>
          <ul className="mt-8 space-y-3 text-emerald-50">
            <li>✅ Calcolo calorie e macro personalizzato</li>
            <li>🔄 Alternative equivalenti per ogni alimento</li>
            <li>🛒 Lista della spesa per reparto</li>
            <li>❤️ Condivisione rapida su WhatsApp</li>
            <li>📈 Grafico del peso</li>
          </ul>
        </div>
        <button className="btn mt-10 w-full bg-white text-lg text-emerald-800" onClick={() => setStep(0)}>
          Iniziamo <ChevronRight />
        </button>
      </div>
    );
  }

  const t = calcTargets(p);
  const next = () => {
    if (step === 0) {
      const err = validateBasics(p);
      if (err) return setError(err);
    }
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else saveProfile(p, true);
  };

  return (
    <div className="flex min-h-full flex-col bg-sage-50">
      <header className="sticky top-0 z-10 bg-sage-50/95 px-5 pb-3 pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
          ))}
        </div>
        <p className="mt-3 text-sm font-medium text-emerald-700">Passo {step + 1} di {STEPS.length}</p>
        <h1 className="text-2xl font-extrabold text-slate-900">{STEPS[step]}</h1>
      </header>

      <main className="flex-1 px-5 pb-32">
        {step === 0 && <BasicFields value={p} onChange={setP} />}
        {step === 1 && <ActivityFields value={p} onChange={setP} />}
        {step === 2 && <GoalFields value={p} onChange={setP} />}
        {step === 3 && <PreferenceFields value={p} onChange={setP} />}
        {step === 4 && (
          <div className="space-y-3">
            <div className="card text-center">
              <p className="text-sm text-slate-500">Calorie giornaliere consigliate</p>
              <p className="text-5xl font-extrabold text-emerald-700">{t.kcal}</p>
              <p className="text-sm text-slate-500">kcal · {GOALS[p.goal].label}</p>
              {t.dailyDelta !== 0 && (
                <p className="mt-2 text-sm font-medium text-slate-700">
                  {t.dailyDelta < 0 ? `Deficit di ${-t.dailyDelta} kcal/giorno` : `Surplus di ${t.dailyDelta} kcal/giorno`} ·{' '}
                  {t.weeklyChangeKg < 0 ? '−' : '+'}
                  {fmt1(Math.abs(t.weeklyChangeKg))} kg/settimana
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Proteine" value={`${t.proteinG}g`} />
              <Stat label="Carboidrati" value={`${t.carbsG}g`} />
              <Stat label="Grassi" value={`${t.fatG}g`} />
            </div>
            <div className="card space-y-1 text-sm text-slate-600">
              <p>Metabolismo basale (Mifflin-St Jeor): <b>{t.bmr} kcal</b></p>
              <p>Fabbisogno totale (TDEE): <b>{t.tdee} kcal</b></p>
            </div>
            <p className="text-xs text-slate-400">
              Valori indicativi, non sostituiscono il parere di un medico o di un nutrizionista.
            </p>
          </div>
        )}
        {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
      </main>

      <footer className="fixed inset-x-0 bottom-0 flex gap-3 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="btn-ghost w-28" onClick={() => setStep(step - 1)}>
          <ChevronLeft /> Indietro
        </button>
        <button className="btn-primary flex-1 text-base" onClick={next}>
          {step === STEPS.length - 1 ? (
            <>
              <Sparkles size={20} /> Genera il mio piano
            </>
          ) : (
            <>
              Avanti <ChevronRight />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <p className="text-xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
