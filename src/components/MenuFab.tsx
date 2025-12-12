import { useThemeStyles } from '../context/useThemeStyles';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getIconSize } from '../utils/themeUtils';
import { FiMenu } from 'react-icons/fi';

export function MenuFab({ onClick }: { onClick: () => void }) {
  const themeStyles = useThemeStyles();
  const { theme } = useRestaurant();
  const templateStyles = getTemplateComponentStyles(theme || null);
  const fabIcon = templateStyles.icons.fab;
  
  // Use consistent size 'lg' (36px) for all floating buttons
  const iconSize = getIconSize('lg');
  const borderRadiusClass = fabIcon?.shape === 'circle' ? 'rounded-full' : 'rounded-lg';
  const animationClass = fabIcon?.animated ? 'hover:scale-110 transition-transform' : '';

  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className={`fixed right-4 bottom-6 z-40 text-white ${borderRadiusClass} shadow-[8px_8px_16px_rgba(0,0,0,0.3),-4px_-4px_10px_rgba(0,0,0,0.05)] hover:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(0,0,0,0.05)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] ${animationClass} transition-all`}
      style={{ 
        background: `linear-gradient(145deg, ${hexToRgba(themeStyles.primaryButtonBg, 0.95)}, ${hexToRgba(themeStyles.primaryButtonBg, 0.85)})`,
        padding: `${iconSize / 8}px`
      }}
      title="Open navigation"
    >
      <FiMenu size={iconSize} />
    </button>
  );
}
