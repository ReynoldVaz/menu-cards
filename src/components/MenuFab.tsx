import { useThemeStyles } from '../context/useThemeStyles';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getIconSize } from '../utils/themeUtils';

export function MenuFab({ onClick }: { onClick: () => void }) {
  const themeStyles = useThemeStyles();
  const { theme } = useRestaurant();
  const templateStyles = getTemplateComponentStyles(theme || null);
  const fabIcon = templateStyles.icons.fab;
  
  // Use consistent size 'lg' (36px) for all floating buttons
  const iconSize = getIconSize('lg');
  const borderRadiusClass = fabIcon?.shape === 'circle' ? 'rounded-full' : fabIcon?.shape === 'rounded-square' ? 'rounded-lg' : 'rounded-none';
  const shadowClass = fabIcon?.shadow || 'shadow-lg';
  const animationClass = fabIcon?.animated ? 'hover:scale-110 transition-transform' : '';

  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className={`fixed right-4 bottom-6 z-40 text-white ${borderRadiusClass} ${shadowClass} ${animationClass}`}
      style={{ 
        backgroundColor: hexToRgba(themeStyles.primaryButtonBg, 0.9),
        padding: `${iconSize / 8}px`
      }}
      title="Open navigation"
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
