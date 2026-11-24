import { Heart } from 'lucide-react';

export function MammaButton({ onClick, label = 'Invia Pranzo e Cena a Mamma' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="btn w-full bg-rose-500 text-white text-base shadow-md active:bg-rose-600 min-h-[56px]">
      <Heart size={22} fill="currentColor" /> {label}
    </button>
  );
}
