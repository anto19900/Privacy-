import { Check, Copy, MessageCircle, Send, Share2 } from 'lucide-react';
import { useState } from 'react';
import { copyText, openTelegram, openWhatsApp, shareNative } from '../lib/share';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  title: string;
  text: string;
  onClose: () => void;
}

export function ShareSheet({ open, title, text, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <Sheet open={open} title={title} subtitle="Anteprima del messaggio" onClose={onClose}>
      <pre className="mb-4 max-h-[40vh] overflow-y-auto whitespace-pre-wrap rounded-2xl bg-emerald-50 p-4 font-sans text-[15px] leading-relaxed text-slate-800">
        {text}
      </pre>
      <div className="grid grid-cols-1 gap-2">
        <button className="btn bg-[#25D366] text-white text-base" onClick={() => openWhatsApp(text)}>
          <MessageCircle size={22} /> Invia su WhatsApp
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-soft" onClick={() => void shareNative(text)}>
            <Share2 size={20} /> Condividi…
          </button>
          <button className="btn-soft" onClick={() => openTelegram(text)}>
            <Send size={20} /> Telegram
          </button>
        </div>
        <button className="btn-ghost" onClick={() => void copy()}>
          {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
          {copied ? 'Copiato!' : 'Copia testo'}
        </button>
      </div>
    </Sheet>
  );
}
