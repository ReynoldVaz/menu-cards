import { useThemeStyles } from '../context/useThemeStyles';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getIconSize } from '../utils/themeUtils';
import { FiSearch } from 'react-icons/fi';

interface SearchIconButtonProps {
  searchBarRef: React.RefObject<HTMLInputElement>;
}

export function SearchIconButton({ searchBarRef }: SearchIconButtonProps) {
  const themeStyles = useThemeStyles();
  const { theme } = useRestaurant();
  const templateStyles = getTemplateComponentStyles(theme || null);
  const searchIcon = templateStyles.icons.search;
  
  // Use consistent size 'lg' (36px) for all floating buttons
  const iconSize = getIconSize('lg');
  const borderRadiusClass = searchIcon?.shape === 'circle' ? 'rounded-full' : searchIcon?.shape === 'rounded-square' ? 'rounded-lg' : 'rounded-none';
  const animationClass = searchIcon?.animated ? 'hover:scale-110 transition-transform' : '';

  return (
    <button
      onClick={() => searchBarRef.current?.focus()}
      className={`fixed right-4 bottom-36 text-white ${borderRadiusClass} shadow-[6px_6px_12px_rgba(0,0,0,0.2),-4px_-4px_10px_rgba(255,255,255,0.1)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.1)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.3)] ${animationClass} z-[40] transition-all`}
      style={{
        background: `linear-gradient(145deg, ${hexToRgba(themeStyles.primaryButtonBg, 0.9)}, ${hexToRgba(themeStyles.primaryButtonBg, 0.8)})`,
        padding: `${iconSize / 8}px`
      }}
      title="Search menu"
      aria-label="Search menu"
    >
      <FiSearch size={iconSize} />
    </button>
  );
}
