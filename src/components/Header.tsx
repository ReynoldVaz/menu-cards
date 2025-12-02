import { Flame } from 'lucide-react';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba } from '../utils/themeUtils';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { restaurant, theme } = useRestaurant();
  const primaryColor = theme?.primaryColor || '#EA580C';
  const secondaryColor = theme?.secondaryColor || '#FB923C';
  const accentColor = theme?.accentColor || '#FED7AA';

  return (
    <div 
      className="relative px-6 py-6 sm:px-8 sm:py-8 text-center text-white"
      style={{
        background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
      }}
    >
      {/* hamburger - visible only on small screens */}
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="absolute left-4 top-4 md:hidden hover:bg-white/20 p-2 rounded"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex justify-center mb-4">
        <Flame className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
        {restaurant?.name || 'Restaurant Menu'}
      </h1>
      <p 
        className="font-light text-xs sm:text-sm tracking-wide"
        style={{ color: hexToRgba(accentColor, 0.9) }}
      >
        {restaurant?.description || 'AUTHENTIC CUISINE'}
      </p>
    </div>
  );
}
