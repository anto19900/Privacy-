import { CalendarDays, Home, Scale, ShoppingCart, User } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { onReminderTap } from './lib/notifications';
import { applyTheme, watchSystemTheme } from './lib/theme';
import { todayIndex } from './lib/plan';
import { useStore } from './lib/store';
import { Today } from './screens/Today';
import { Week } from './screens/Week';

// schermate caricate solo quando servono (Recharts pesa: va in un chunk separato)
const Onboarding = lazy(() => import('./screens/Onboarding').then((m) => ({ default: m.Onboarding })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const Shopping = lazy(() => import('./screens/Shopping').then((m) => ({ default: m.Shopping })));
const Weight = lazy(() => import('./screens/Weight').then((m) => ({ default: m.Weight })));

const Loading = () => <div className="flex h-40 items-center justify-center text-slate-400">Caricamento…</div>;

type Tab = 'oggi' | 'settimana' | 'spesa' | 'peso' | 'profilo';

const TABS: { id: Tab; label: string; Icon: typeof Home }[] = [
  { id: 'oggi', label: 'Oggi', Icon: Home },
  { id: 'settimana', label: 'Settimana', Icon: CalendarDays },
  { id: 'spesa', label: 'Spesa', Icon: ShoppingCart },
  { id: 'peso', label: 'Peso', Icon: Scale },
  { id: 'profilo', label: 'Profilo', Icon: User },
];

export default function App() {
  const { profile, plan } = useStore();
  const [tab, setTab] = useState<Tab>('oggi');
  const mainRef = useRef<HTMLElement>(null);
  const theme = profile?.theme ?? 'system';
  useEffect(() => {
    applyTheme(theme);
    return watchSystemTheme(theme, () => applyTheme(theme));
  }, [theme]);
  // apertura da notifica "menù a Mamma": settimana sul giorno dopo, con il messaggio già pronto
  const [weekOpen, setWeekOpen] = useState<{ day: number; mamma: boolean; n: number } | null>(null);

  useEffect(
    () =>
      onReminderTap((t) => {
        if (t === 'mamma') {
          setWeekOpen((w) => ({ day: (todayIndex() + 1) % 7, mamma: true, n: (w?.n ?? 0) + 1 }));
          setTab('settimana');
        } else if (t === 'peso' || t === 'spesa' || t === 'oggi') setTab(t);
      }),
    [],
  );

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  // Tasto "indietro" di Android: torna a "Oggi", poi esce dall'app.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const h = CapApp.addListener('backButton', () => {
      setTab((t) => {
        if (t === 'oggi') void CapApp.exitApp();
        return 'oggi';
      });
    });
    return () => {
      void h.then((l) => l.remove());
    };
  }, []);

  if (!profile || !plan)
    return (
      <Suspense fallback={<Loading />}>
        <Onboarding />
      </Suspense>
    );

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-sage-50">
      <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-28 pt-[calc(1rem+env(safe-area-inset-top))]">
        <Suspense fallback={<Loading />}>
        {tab === 'oggi' && <Today onOpenWeek={() => { setWeekOpen(null); setTab('settimana'); }} />}
        {tab === 'settimana' && <Week key={weekOpen?.n ?? 0} initialDay={weekOpen?.day} openMamma={weekOpen?.mamma} />}
        {tab === 'spesa' && <Shopping />}
        {tab === 'peso' && <Weight />}
        {tab === 'profilo' && <ProfileScreen />}
        </Suspense>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ id, label, Icon }) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => { setWeekOpen(null); setTab(id); }} className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs font-semibold ${on ? 'text-emerald-700' : 'text-slate-500'}`}>
                <span className={`rounded-full px-4 py-1 ${on ? 'bg-emerald-100' : ''}`}>
                  <Icon size={22} strokeWidth={on ? 2.5 : 2} />
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
