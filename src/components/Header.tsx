import { Flame } from 'lucide-react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="relative bg-gradient-to-r from-orange-600 to-amber-600 px-6 py-6 sm:px-8 sm:py-8 text-center text-white">
      {/* hamburger - visible only on small screens */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="absolute left-4 top-4 md:hidden bg-white/10 hover:bg-white/20 p-2 rounded"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex justify-center mb-4">
        <Flame className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">Cota Cozinha</h1>
      <p className="text-orange-100 font-light text-xs sm:text-sm tracking-wide">
        AUTHENTIC INDIAN CUISINE
      </p>
    </div>
  );
}
