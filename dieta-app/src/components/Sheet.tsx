import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet modale, comodo da usare con una mano. */
export function Sheet({ open, title, subtitle, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-slate-900/40" aria-label="Chiudi" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl animate-[slideUp_.2s_ease-out]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 active:bg-slate-100" aria-label="Chiudi">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
