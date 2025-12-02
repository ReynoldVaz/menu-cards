import { useThemeStyles } from '../context/useThemeStyles';
import { useRestaurant } from '../context/useRestaurant';
import { hexToRgba, getTemplateComponentStyles, getIconSize } from '../utils/themeUtils';

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
  const shadowClass = searchIcon?.shadow || 'shadow-md';
  const animationClass = searchIcon?.animated ? 'hover:scale-110 transition-transform' : '';

  return (
    <button
      onClick={() => searchBarRef.current?.focus()}
      className={`fixed right-4 bottom-36 text-white ${borderRadiusClass} ${shadowClass} ${animationClass} z-[40]`}
      style={{
        backgroundColor: hexToRgba(themeStyles.primaryButtonBg, 0.85),
        padding: `${iconSize / 8}px`
      }}
      title="Search menu"
      aria-label="Search menu"
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}
