import { Flame } from 'lucide-react';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getTypographyStyle } from '../utils/themeUtils';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { restaurant, theme } = useRestaurant();
  const primaryColor = theme?.primaryColor || '#EA580C';
  const secondaryColor = theme?.secondaryColor || '#FB923C';
  const accentColor = theme?.accentColor || '#FED7AA';
  const [mounted, setMounted] = useState(false);
  
  const templateStyles = getTemplateComponentStyles(theme || null);
  const restaurantNameStyle = getTypographyStyle(templateStyles.typography.restaurantName);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div 
      className={`relative text-white transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
      style={{
        background: `linear-gradient(to bottom, ${primaryColor} 0%, ${secondaryColor} 60%, #1F2937 100%)`,
      }}
    >
      {/* hamburger - visible only on small screens */}
      {/* <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className="absolute left-4 top-4 md:hidden hover:bg-white/20 p-2 rounded z-10"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button> */}

      {restaurant?.logo ? (
        /* Centered logo with object-contain (no zoom/crop) */
        <div 
          className="w-full relative overflow-hidden flex items-center justify-center"
          style={{ minHeight: '28vh' }}
        >
          {/* Premium gradient background */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${primaryColor} 0%, ${secondaryColor} 60%, #111827 100%)` }} />
          {/* Soft vignette for depth */}
          <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 120px rgba(0,0,0,0.35)' }} />
          {/* Logo */}
          <img 
            src={restaurant.logo} 
            alt={restaurant.name || 'Restaurant Logo'} 
            className="relative z-10 object-contain"
            style={{ maxHeight: '22vh', maxWidth: '85vw' }}
          />
        </div>
      ) : (
        /* Original content when no logo */
        <div className="px-6 py-6 sm:px-8 sm:py-8 text-center">
          <div className="flex justify-center mb-4">
            <Flame className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={1.5} />
          </div>
          <h1 
            className="tracking-tight mb-2"
            style={restaurantNameStyle}
          >
            {restaurant?.name || 'Restaurant Menu'}
          </h1>
          <p 
            className="font-light text-xs sm:text-sm tracking-wide"
            style={{ color: hexToRgba(accentColor, 0.9) }}
          >
            {restaurant?.description || 'AUTHENTIC CUISINE'}
          </p>
        </div>
      )}
    </div>
  );
}
