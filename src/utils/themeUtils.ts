/**
 * Theme Color Utility
 * Converts restaurant theme colors to inline styles for dynamic theming
 */

import type { Theme } from '../hooks/useFirebaseRestaurant';

export interface ThemeStyles {
  backgroundColor: string;
  textColor: string;
  primaryButtonBg: string;
  primaryButtonBgHover: string;
  borderColor: string;
  accentBg: string;
  gradientBg: string;
}

// Default theme (orange - original)
export const DEFAULT_THEME: Theme = {
  mode: 'light',
  primaryColor: '#EA580C',
  secondaryColor: '#FB923C',
  accentColor: '#FED7AA',
  backgroundColor: '#FFFFFF',
};

/**
 * Convert hex color to rgba
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get theme-based styles for UI components
 */
export function getThemeStyles(theme: Theme | null): ThemeStyles {
  const t = theme || DEFAULT_THEME;
  // Determine text color based on background: dark text for light backgrounds, light text for dark
  const isDarkBg = t.backgroundColor.toLowerCase() === '#ffffff' || t.backgroundColor.toLowerCase() === 'ffffff';
  const textColor = isDarkBg ? '#374151' : '#FFFFFF';

  return {
    backgroundColor: t.backgroundColor,
    textColor: textColor,
    primaryButtonBg: t.primaryColor,
    primaryButtonBgHover: t.secondaryColor,
    borderColor: t.accentColor,
    accentBg: t.accentColor,
    gradientBg: `linear-gradient(to bottom, ${hexToRgba(t.accentColor, 0.5)}, ${t.backgroundColor}, ${hexToRgba(t.primaryColor, 0.1)})`,
  };
}

/**
 * Generate Tailwind-compatible classes from theme colors
 * Falls back to default orange theme if no theme provided
 */
export function getThemeClasses(theme: Theme | null) {
  const t = theme || DEFAULT_THEME;

  return {
    // Background & Gradients
    pageBg: `bg-gradient-to-b from-${rgbToTailwind(t.accentColor)} via-white to-${rgbToTailwind(t.primaryColor)}`,
    cardBg: 'bg-white',
    cardBorder: `border-${rgbToTailwind(t.accentColor)}`,

    // Buttons
    primaryButton: `bg-${rgbToTailwind(t.primaryColor)} hover:bg-${rgbToTailwind(t.secondaryColor)}`,
    secondaryButton: `bg-${rgbToTailwind(t.secondaryColor)}`,

    // Text
    primaryText: `text-${rgbToTailwind(t.primaryColor)}`,
    accentText: `text-${rgbToTailwind(t.secondaryColor)}`,

    // Borders & Dividers
    primaryBorder: `border-${rgbToTailwind(t.accentColor)}`,
  };
}

/**
 * Convert hex to Tailwind color value (for use in class names)
 * Since Tailwind doesn't support arbitrary colors directly in classes,
 * we use inline styles instead
 */
function rgbToTailwind(hex: string): string {
  // This is a placeholder - actual Tailwind theming requires CSS variables or inline styles
  return hex;
}

/**
 * Generate inline CSS styles object from theme
 */
export function getThemeInlineStyles(theme: Theme | null) {
  const t = theme || DEFAULT_THEME;

  return {
    '--primary-color': t.primaryColor,
    '--secondary-color': t.secondaryColor,
    '--accent-color': t.accentColor,
  } as React.CSSProperties & Record<string, string>;
}
