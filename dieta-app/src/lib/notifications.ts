import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { THERAPY_ID_BASE, THERAPY_ID_MAX, therapyNotifications } from './therapy';
import type { Reminder, Reminders, Therapy, TherapyLog } from './types';

export const DEFAULT_REMINDERS: Reminders = {
  weigh: { enabled: false, weekday: 0, hour: 7, minute: 30 },
  mamma: { enabled: false, weekday: -1, hour: 20, minute: 30 },
  shopping: { enabled: false, weekday: 5, hour: 9, minute: 30 },
};

const IDS = { weigh: 101, mamma: 102, shopping: 103 } as const;
const CHANNEL = 'promemoria';

export const REMINDER_INFO: Record<keyof Reminders, { title: string; body: string; label: string; emoji: string; tab: string }> = {
  weigh: { label: 'Pesata', emoji: '⚖️', title: 'È ora di pesarti ⚖️', body: 'A digiuno, dopo il bagno: registra il peso nella app.', tab: 'peso' },
  mamma: { label: 'Menù a Mamma', emoji: '❤️', title: 'Manda il menù a Mamma ❤️', body: 'Invia pranzo e cena di domani con un tocco.', tab: 'mamma' },
  shopping: { label: 'Lista della spesa', emoji: '🛒', title: 'Giorno di spesa 🛒', body: 'La lista della settimana è pronta, per reparto.', tab: 'spesa' },
};

export function notificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/** 0 = Lunedì (app) → 1 = Domenica … 7 = Sabato (Capacitor). */
function capWeekday(d: number): number {
  return ((d + 1) % 7) + 1;
}

function schedule(r: Reminder) {
  return r.weekday === -1 ? { on: { hour: r.hour, minute: r.minute } } : { on: { weekday: capWeekday(r.weekday), hour: r.hour, minute: r.minute } };
}

export type ApplyResult = 'ok' | 'denied' | 'unsupported' | 'error';

/** Cancella e ripianifica tutti i promemoria in base alle impostazioni. */
export async function applyReminders(r: Reminders): Promise<ApplyResult> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    const anyOn = Object.values(r).some((x) => x.enabled);
    if (anyOn) {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
      if (perm.display !== 'granted') return 'denied';
      await LocalNotifications.createChannel({ id: CHANNEL, name: 'Promemoria', description: 'Pesata, menù e spesa', importance: 4 });
    }
    await LocalNotifications.cancel({ notifications: Object.values(IDS).map((id) => ({ id })) });
    const list = (Object.keys(IDS) as (keyof Reminders)[])
      .filter((k) => r[k].enabled)
      .map((k) => ({
        id: IDS[k],
        title: REMINDER_INFO[k].title,
        body: REMINDER_INFO[k].body,
        channelId: CHANNEL,
        schedule: schedule(r[k]),
        extra: { tab: REMINDER_INFO[k].tab },
      }));
    if (list.length) await LocalNotifications.schedule({ notifications: list });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Tocco su una notifica → apre la schermata giusta. */
export function onReminderTap(cb: (tab: string) => void): () => void {
  if (!notificationsSupported()) return () => {};
  const h = LocalNotifications.addListener('localNotificationActionPerformed', (e) => {
    const tab = (e.notification.extra as { tab?: string } | undefined)?.tab;
    if (tab) cb(tab);
  });
  return () => {
    void h.then((l) => l.remove());
  };
}

// ---------- Terapia ----------

const THERAPY_CHANNEL = 'terapia';

/** Ripianifica tutte le notifiche della terapia (cancellando le precedenti). */
export async function applyTherapy(t: Therapy, log: TherapyLog): Promise<ApplyResult> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    const pending = await LocalNotifications.getPending();
    const old = pending.notifications.filter((n) => n.id >= THERAPY_ID_BASE && n.id <= THERAPY_ID_MAX).map((n) => ({ id: n.id }));
    if (old.length) await LocalNotifications.cancel({ notifications: old });
    if (!t.enabled) return 'ok';

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') return 'denied';
    await LocalNotifications.createChannel({ id: THERAPY_CHANNEL, name: 'Terapia', description: 'Promemoria del farmaco', importance: 5, vibration: true });

    const list = therapyNotifications(t, log).map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      channelId: THERAPY_CHANNEL,
      schedule: { at: n.at, allowWhileIdle: true },
      extra: { tab: 'oggi' },
    }));
    // a blocchi per non superare i limiti del bridge
    for (let i = 0; i < list.length; i += 60) await LocalNotifications.schedule({ notifications: list.slice(i, i + 60) });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Android 12+: gli orari esatti richiedono il permesso "Sveglie e promemoria". */
export async function exactAlarmsAllowed(): Promise<boolean> {
  if (!notificationsSupported()) return true;
  try {
    return (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted';
  } catch {
    return true;
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch {
    /* non disponibile */
  }
}
