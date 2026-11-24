import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isoDate } from './format';
import { allPhotos, clearPhotos, savePhoto } from './photos';
import { exportBackup } from './storage';
import type { Measurement, WeightEntry } from './types';

export const BACKUP_APP = 'dieta-spesa';

/** Salva un file: su Android lo scrive nella cache e apre la condivisione (Drive, email, WhatsApp…). */
export async function saveFile(name: string, content: string, mime: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const res = await Filesystem.writeFile({ path: name, data: content, directory: Directory.Cache, encoding: Encoding.UTF8 });
    await Share.share({ title: name, files: [res.uri], dialogTitle: 'Salva o invia il file' });
    return;
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportJson(includePhotos: boolean): Promise<void> {
  const data: Record<string, unknown> = { app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), ...exportBackup() };
  if (includePhotos) data.photos = await allPhotos();
  await saveFile(`dieta-spesa-backup-${isoDate()}.json`, JSON.stringify(data), 'application/json');
}

export function parseBackup(text: string): Record<string, unknown> {
  const data = JSON.parse(text) as Record<string, unknown>;
  if (!data || typeof data !== 'object' || (data.app !== BACKUP_APP && !('profile' in data))) {
    throw new Error('Il file non è un backup di Dieta & Spesa.');
  }
  return data;
}

export async function restorePhotos(data: Record<string, unknown>): Promise<void> {
  const photos = data.photos as Record<string, string> | undefined;
  if (!photos) return;
  await clearPhotos();
  for (const [id, url] of Object.entries(photos)) if (typeof url === 'string') await savePhoto(id, url);
}

const num = (n?: number) => (n === undefined ? '' : String(n).replace('.', ','));

/** CSV per Excel/Fogli (separatore ";" e virgola decimale, come in Italia). */
export function progressCsv(weights: WeightEntry[], measurements: Measurement[]): string {
  const dates = [...new Set([...weights.map((w) => w.date), ...measurements.map((m) => m.date)])].sort();
  const rows = ['data;peso_kg;vita_cm;fianchi_cm;collo_cm;petto_cm;braccio_cm;coscia_cm'];
  for (const d of dates) {
    const w = weights.find((x) => x.date === d);
    const m = measurements.find((x) => x.date === d);
    rows.push([d, num(w?.kg), num(m?.waist), num(m?.hips), num(m?.neck), num(m?.chest), num(m?.arm), num(m?.thigh)].join(';'));
  }
  return '﻿' + rows.join('\n'); // BOM: Excel riconosce l'UTF-8
}

export async function exportCsv(weights: WeightEntry[], measurements: Measurement[]): Promise<void> {
  await saveFile(`dieta-spesa-progressi-${isoDate()}.csv`, progressCsv(weights, measurements), 'text/csv');
}
