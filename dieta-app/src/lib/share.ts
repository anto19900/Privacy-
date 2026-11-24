import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';

/** Apre il foglio di condivisione nativo di Android (o Web Share API nel browser). */
export async function shareNative(text: string, title = 'Dieta & Spesa'): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title, text, dialogTitle: 'Condividi con…' });
      return true;
    }
    if (navigator.share) {
      await navigator.share({ title, text });
      return true;
    }
  } catch {
    // annullato dall'utente
    return false;
  }
  return false;
}

/** Apre WhatsApp con il testo precompilato (l'utente sceglie il contatto). */
export function openWhatsApp(text: string): void {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  // In Capacitor gli URL esterni vengono aperti tramite Intent ACTION_VIEW (app WhatsApp o browser).
  if (Capacitor.isNativePlatform()) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

export function openTelegram(text: string): void {
  const url = `https://t.me/share/url?url=${encodeURIComponent(' ')}&text=${encodeURIComponent(text)}`;
  if (Capacitor.isNativePlatform()) window.location.href = url;
  else window.open(url, '_blank', 'noopener');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Clipboard.write({ string: text });
      return true;
    }
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
