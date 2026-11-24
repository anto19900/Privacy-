import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { Profile } from './types';

export type ThemeChoice = NonNullable<Profile['theme']>;

function systemDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Applica il tema (classe .dark su <html> + colore della status bar Android). */
export function applyTheme(choice: ThemeChoice = 'system'): boolean {
  const dark = choice === 'dark' || (choice === 'system' && systemDark());
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1512' : '#f3f7f4');
  if (Capacitor.isNativePlatform()) {
    void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => undefined);
    void StatusBar.setBackgroundColor({ color: dark ? '#0f1512' : '#f3f7f4' }).catch(() => undefined);
  }
  return dark;
}

/** Segue i cambi di tema del sistema quando la scelta è "Sistema". */
export function watchSystemTheme(choice: ThemeChoice, cb: () => void): () => void {
  if (choice !== 'system' || !window.matchMedia) return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
