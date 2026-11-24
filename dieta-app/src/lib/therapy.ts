import { isoDate } from './format';
import type { Therapy, TherapyLog } from './types';

/** Schema a step come da prescrizione: 1,5 mg (1° mese) → 4 mg (2° mese) → 9 mg (3° e 4° mese), controllo al 5° mese. */
export const WEGOVY_PILLS_PRESET: Therapy = {
  enabled: true,
  name: 'Wegovy pills',
  startDate: '2027-01-01',
  steps: [
    { months: 1, dose: '1,5 mg' },
    { months: 1, dose: '4 mg' },
    { months: 2, dose: '9 mg' },
  ],
  hour: 12,
  minute: 30,
  instructions: "1 compressa, mezz'ora prima di un pasto principale",
  checkupMonth: 5,
  checkupNote: 'Esami: glicemia, emoglobina glicosilata, insulinemia, amilasi e lipasi, transaminasi, colesterolo LDL e HDL, trigliceridi, gamma GT',
};

export const EMPTY_THERAPY: Therapy = { ...WEGOVY_PILLS_PRESET, enabled: false };

/** Data ISO + n mesi di calendario (31 gen + 1 mese = 28/29 feb). */
export function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(y, m - 1 + n, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return isoDate(new Date(first.getFullYear(), first.getMonth(), Math.min(d, last)));
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + n));
}

export function daysBetween(a: string, b: string): number {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export interface Phase {
  index: number;
  dose: string;
  from: string; // incluso
  to: string; // escluso
  firstMonth: number; // 1 = primo mese
  months: number;
}

export function phases(t: Therapy): Phase[] {
  let month = 0;
  return t.steps.map((s, index) => {
    const ph = { index, dose: s.dose, from: addMonths(t.startDate, month), to: addMonths(t.startDate, month + s.months), firstMonth: month + 1, months: s.months };
    month += s.months;
    return ph;
  });
}

export function therapyEnd(t: Therapy): string {
  return addMonths(t.startDate, t.steps.reduce((s, x) => s + x.months, 0));
}

export function checkupDate(t: Therapy): string | null {
  return t.checkupMonth ? addMonths(t.startDate, t.checkupMonth - 1) : null;
}

export type TherapyStatus =
  | { kind: 'off' }
  | { kind: 'before'; daysToStart: number }
  | { kind: 'active'; phase: Phase; month: number; dayOfMonth: number; daysInMonth: number; daysToNext: number; nextDose?: string; taken: boolean }
  | { kind: 'ended'; checkup: string | null };

/** Stato della terapia per una certa data. */
export function therapyStatus(t: Therapy, log: TherapyLog, today = isoDate()): TherapyStatus {
  if (!t.enabled || t.steps.length === 0) return { kind: 'off' };
  if (today < t.startDate) return { kind: 'before', daysToStart: daysBetween(today, t.startDate) };
  const ph = phases(t).find((p) => today >= p.from && today < p.to);
  if (!ph) return { kind: 'ended', checkup: checkupDate(t) };
  // mese di terapia (1-based) e giorno nel mese
  let month = 1;
  while (addMonths(t.startDate, month) <= today) month++;
  const mFrom = addMonths(t.startDate, month - 1);
  const mTo = addMonths(t.startDate, month);
  const next = phases(t)[ph.index + 1];
  return {
    kind: 'active',
    phase: ph,
    month,
    dayOfMonth: daysBetween(mFrom, today) + 1,
    daysInMonth: daysBetween(mFrom, mTo),
    daysToNext: daysBetween(today, ph.to),
    nextDose: next?.dose,
    taken: !!log[today],
  };
}

export interface PlannedNotification {
  id: number;
  at: Date;
  title: string;
  body: string;
}

const atTime = (iso: string, h: number, m: number) => {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0);
};

export const THERAPY_ID_BASE = 2000;
export const THERAPY_ID_MAX = 2999;

/**
 * Tutte le notifiche future della terapia: una al giorno con la dose giusta
 * (saltando i giorni già segnati come "presa"), più gli avvisi di cambio mese/dose e del controllo.
 */
export function therapyNotifications(t: Therapy, log: TherapyLog, now = new Date()): PlannedNotification[] {
  if (!t.enabled || t.steps.length === 0) return [];
  const out: PlannedNotification[] = [];
  const end = therapyEnd(t);
  const phs = phases(t);
  let day = 0;
  for (let iso = t.startDate; iso < end; iso = addDays(iso, 1), day++) {
    const ph = phs.find((p) => iso >= p.from && iso < p.to)!;
    let month = 1;
    while (addMonths(t.startDate, month) <= iso) month++;
    const at = atTime(iso, t.hour, t.minute);
    if (at > now && !log[iso] && day < 800) {
      out.push({ id: THERAPY_ID_BASE + 100 + day, at, title: `💊 ${t.name} ${ph.dose}`, body: `${t.instructions} · ${month}° mese di terapia` });
    }
  }
  // inizio di ogni mese (dal 2°): cambio dose o "è passato un mese"
  const totalMonths = t.steps.reduce((s, x) => s + x.months, 0);
  for (let m = 1; m < totalMonths; m++) {
    const iso = addMonths(t.startDate, m);
    const ph = phs.find((p) => iso >= p.from && iso < p.to)!;
    const prev = phs.find((p) => addDays(iso, -1) >= p.from && addDays(iso, -1) < p.to)!;
    const changed = ph.dose !== prev.dose;
    const at = atTime(iso, 8, 0);
    if (at > now)
      out.push({
        id: THERAPY_ID_BASE + m,
        at,
        title: changed ? `📈 Da oggi: ${t.name} ${ph.dose}` : `🗓️ Inizia il ${m + 1}° mese di terapia`,
        body: changed
          ? `È passato ${m === 1 ? 'un mese' : `${m} mesi`}: si passa da ${prev.dose} a ${ph.dose}, come indicato dal medico.`
          : `È passato ${m === 1 ? 'un mese' : `${m} mesi`}: si continua con ${ph.dose}.`,
      });
  }
  const chk = checkupDate(t);
  if (chk) {
    const remind = atTime(addDays(chk, -7), 9, 0);
    if (remind > now)
      out.push({ id: THERAPY_ID_BASE + 90, at: remind, title: '🩺 Tra una settimana: controllo', body: `Prenota esami e visita. ${t.checkupNote ?? ''}`.trim() });
    const at = atTime(chk, 9, 0);
    if (at > now)
      out.push({ id: THERAPY_ID_BASE + 91, at, title: `🩺 ${t.checkupMonth}° mese: controllo dal medico`, body: t.checkupNote ?? 'Controllo previsto dalla terapia.' });
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
