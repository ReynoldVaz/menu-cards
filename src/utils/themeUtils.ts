/**
 * Theme Color Utility
 * Converts restaurant theme colors to inline styles for dynamic theming
 */

import type { Theme, TypographyStyle, ButtonStyle, IconStyle } from '../hooks/useFirebaseRestaurant';

export interface ThemeStyles {
  backgroundColor: string;
  textColor: string;
  primaryButtonBg: string;
  primaryButtonBgHover: string;
  borderColor: string;
  accentBg: string;
  gradientBg: string;
}

export interface TemplateComponentStyles {
  themeStyles: ThemeStyles;
  typography: {
    restaurantName?: TypographyStyle;
    sectionHeader?: TypographyStyle;
    itemName?: TypographyStyle;
    itemDescription?: TypographyStyle;
    price?: TypographyStyle;
  };
  buttons: {
    primary?: ButtonStyle;
    secondary?: ButtonStyle;
    icon?: ButtonStyle;
  };
  icons: {
    fab?: IconStyle;
    search?: IconStyle;
    chat?: IconStyle;
    menu?: IconStyle;
  };
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
export function hexToRgba(hex: string | undefined, alpha: number): string {
  if (!hex) return 'rgba(255, 255, 255, 0)';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Helper to determine if a hex color is dark or light
 */
function isColorDark(hexColor: string | undefined): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 128;
}

/**
 * Get theme-based styles for UI components
 */
export function getThemeStyles(theme: Theme | null): ThemeStyles {
  const t = theme || DEFAULT_THEME;
  // Determine text color based on background brightness
  const bgColor = t.backgroundColor || DEFAULT_THEME.backgroundColor;
  const isDarkBg = isColorDark(bgColor);
  const textColor = isDarkBg ? '#FFFFFF' : '#374151';

  return {
    backgroundColor: bgColor,
    textColor: textColor,
    primaryButtonBg: t.primaryColor || DEFAULT_THEME.primaryColor,
    primaryButtonBgHover: t.secondaryColor || DEFAULT_THEME.secondaryColor,
    borderColor: t.accentColor || DEFAULT_THEME.accentColor,
    accentBg: t.accentColor || DEFAULT_THEME.accentColor,
    gradientBg: `linear-gradient(to bottom, ${hexToRgba(t.accentColor || DEFAULT_THEME.accentColor, 0.5)}, ${bgColor}, ${hexToRgba(t.primaryColor || DEFAULT_THEME.primaryColor, 0.1)})`,
  };
}

/**
 * Get template-aware component styles
 */
export function getTemplateComponentStyles(theme: Theme | null): TemplateComponentStyles {
  const themeStyles = getThemeStyles(theme);
  const t = theme || DEFAULT_THEME;

  // Default component styles (used if template doesn't specify)
  const defaultTypography = {
    restaurantName: {
      fontSize: '2.5rem',
      fontWeight: 'bold' as const,
      fontFamily: 'inherit',
      letterSpacing: '0px',
      textTransform: 'uppercase' as const,
    },
    sectionHeader: {
      fontSize: '1.5rem',
      fontWeight: 'bold' as const,
      fontFamily: 'inherit',
    },
    itemName: {
      fontSize: '1.1rem',
      fontWeight: 'semibold' as const,
      fontFamily: 'inherit',
    },
    itemDescription: {
      fontSize: '0.875rem',
      fontWeight: 'normal' as const,
      fontFamily: 'inherit',
    },
    price: {
      fontSize: '1.25rem',
      fontWeight: 'bold' as const,
      fontFamily: 'inherit',
    },
  };

  const defaultButtons = {
    primary: {
      borderRadius: 'rounded-lg' as const,
      shadow: 'shadow-md' as const,
      fontSize: '0.95rem',
      padding: 'px-6 py-2.5',
    },
    secondary: {
      borderRadius: 'rounded-md' as const,
      shadow: 'shadow-sm' as const,
      fontSize: '0.9rem',
      padding: 'px-4 py-2',
    },
    icon: {
      borderRadius: 'rounded-lg' as const,
      shadow: 'shadow-md' as const,
      fontSize: '1rem',
      padding: 'p-3',
    },
  };

  const defaultIcons = {
    fab: {
      size: 'lg' as const,
      shape: 'square' as const,
      animated: true,
    },
    search: {
      size: 'md' as const,
      shape: 'rounded-square' as const,
      animated: false,
    },
    chat: {
      size: 'lg' as const,
      shape: 'rounded-square' as const,
      animated: true,
    },
    menu: {
      size: 'md' as const,
      shape: 'circle' as const,
      animated: false,
    },
  };

  return {
    themeStyles,
    typography: {
      ...defaultTypography,
      ...t.typography,
    },
    buttons: {
      ...defaultButtons,
      ...t.buttons,
    },
    icons: {
      ...defaultIcons,
      ...t.icons,
    },
  };
}

/**
 * Get typography inline styles
 */
export function getTypographyStyle(typo: TypographyStyle | undefined): React.CSSProperties {
  if (!typo) return {};
  return {
    fontSize: typo.fontSize,
    fontWeight: typo.fontWeight as any,
    fontFamily: typo.fontFamily,
    letterSpacing: typo.letterSpacing,
    textTransform: typo.textTransform as any,
  };
}

/**
 * Get button inline styles
 */
export function getButtonStyle(button: ButtonStyle | undefined): string {
  if (!button) return '';
  return `${button.borderRadius} ${button.shadow} px-4 py-2`;
}

/**
 * Get icon size in pixels
 */
export function getIconSize(size: 'sm' | 'md' | 'lg' | 'xl'): number {
  const sizes = { sm: 20, md: 28, lg: 36, xl: 48 };
  return sizes[size];
}

/**
 * Generate inline CSS styles object from theme
 */
export function getThemeInlineStyles(theme: Theme | null) {
  const t = theme || DEFAULT_THEME;

  return {
    '--primary-color': t.primaryColor || DEFAULT_THEME.primaryColor,
    '--secondary-color': t.secondaryColor || DEFAULT_THEME.secondaryColor,
    '--accent-color': t.accentColor || DEFAULT_THEME.accentColor,
  } as React.CSSProperties & Record<string, string>;
}
