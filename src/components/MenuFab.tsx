import { useThemeStyles } from '../context/useThemeStyles';
import { hexToRgba } from '../utils/themeUtils';

export function MenuFab({ onClick }: { onClick: () => void }) {
  const themeStyles = useThemeStyles();
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className="fixed right-4 bottom-6 z-40 text-white p-3 rounded-full shadow-lg"
      style={{ backgroundColor: hexToRgba(themeStyles.backgroundColor, 0.8) }}
      title="Open navigation"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
