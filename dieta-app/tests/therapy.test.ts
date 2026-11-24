import { describe, expect, it } from 'vitest';
import { addMonths, checkupDate, phases, therapyEnd, therapyNotifications, therapyStatus, WEGOVY_PILLS_PRESET } from '../src/lib/therapy';

const t = { ...WEGOVY_PILLS_PRESET, startDate: '2027-01-01' };

describe('terapia a step', () => {
  it('mesi di calendario (31 gen + 1 mese = 28 feb)', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonths('2027-01-01', 4)).toBe('2027-05-01');
  });

  it('calendario come da prescrizione', () => {
    const p = phases(t);
    expect(p.map((x) => [x.dose, x.from, x.to])).toEqual([
      ['1,5 mg', '2027-01-01', '2027-02-01'],
      ['4 mg', '2027-02-01', '2027-03-01'],
      ['9 mg', '2027-03-01', '2027-05-01'],
    ]);
    expect(therapyEnd(t)).toBe('2027-05-01');
    expect(checkupDate(t)).toBe('2027-05-01'); // inizio del quinto mese
  });

  it('stato del giorno', () => {
    expect(therapyStatus(t, {}, '2026-12-25')).toEqual({ kind: 'before', daysToStart: 7 });
    const s = therapyStatus(t, { '2027-02-10': true }, '2027-02-10');
    expect(s.kind).toBe('active');
    if (s.kind === 'active') {
      expect(s.phase.dose).toBe('4 mg');
      expect(s.month).toBe(2);
      expect(s.dayOfMonth).toBe(10);
      expect(s.taken).toBe(true);
      expect(s.nextDose).toBe('9 mg');
      expect(s.daysToNext).toBe(19);
    }
    const s4 = therapyStatus(t, {}, '2027-04-15');
    expect(s4.kind === 'active' && s4.month === 4 && s4.phase.dose === '9 mg').toBe(true);
    expect(therapyStatus(t, {}, '2027-05-02').kind).toBe('ended');
  });

  it('una notifica al giorno con la dose giusta, saltando i giorni già presi', () => {
    const now = new Date(2026, 10, 24);
    const all = therapyNotifications(t, {}, now);
    const daily = all.filter((n) => n.title.startsWith('💊'));
    expect(daily).toHaveLength(120); // 1 gen → 30 apr
    expect(daily[0].title).toBe('💊 Wegovy pills 1,5 mg');
    expect(daily[0].at.getHours()).toBe(12);
    expect(daily[31].title).toContain('4 mg'); // 1 febbraio
    expect(daily[119].title).toContain('9 mg');
    expect(therapyNotifications(t, { '2027-01-01': true }, now).filter((n) => n.title.startsWith('💊'))).toHaveLength(119);
    const ids = all.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('avvisi di cambio dose, mesi e controllo', () => {
    const titles = therapyNotifications(t, {}, new Date(2026, 10, 24))
      .filter((n) => !n.title.startsWith('💊'))
      .map((n) => n.title);
    expect(titles).toEqual([
      '📈 Da oggi: Wegovy pills 4 mg',
      '📈 Da oggi: Wegovy pills 9 mg',
      '🗓️ Inizia il 4° mese di terapia',
      '🩺 Tra una settimana: controllo',
      '🩺 5° mese: controllo dal medico',
    ]);
  });
});
