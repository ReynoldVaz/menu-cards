/**
 * Predefined Template Styles
 * Each template defines typography, button styles, and icon styles
 */

import type { Theme, TypographyStyle, ButtonStyle, IconStyle } from '../hooks/useFirebaseRestaurant';

// ==================== MODERN TEMPLATE ====================
export const MODERN_TEMPLATE: Partial<Theme> = {
  template: 'modern',
  typography: {
    restaurantName: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      fontFamily: '"Segoe UI", sans-serif',
      letterSpacing: '-0.5px',
      textTransform: 'uppercase',
    },
    sectionHeader: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      fontFamily: '"Segoe UI", sans-serif',
      letterSpacing: '0.5px',
      textTransform: 'capitalize',
    },
    itemName: {
      fontSize: '1.1rem',
      fontWeight: 'semibold',
      fontFamily: '"Segoe UI", sans-serif',
    },
    itemDescription: {
      fontSize: '0.875rem',
      fontWeight: 'normal',
      fontFamily: '"Segoe UI", sans-serif',
    },
    price: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      fontFamily: '"Segoe UI", sans-serif',
    },
  },
  buttons: {
    primary: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      fontSize: '0.95rem',
      padding: 'px-6 py-2.5',
    },
    secondary: {
      borderRadius: 'rounded-md',
      shadow: 'shadow-sm',
      fontSize: '0.9rem',
      padding: 'px-4 py-2',
    },
    icon: {
      borderRadius: 'rounded-lg',
      shadow: 'shadow-md',
      fontSize: '1rem',
      padding: 'p-3',
    },
  },
  icons: {
    fab: {
      size: 'lg',
      shape: 'square',
      backgroundColor: 'auto',
      animated: true,
    },
    search: {
      size: 'md',
      shape: 'rounded-square',
      backgroundColor: 'auto',
      animated: false,
    },
    chat: {
      size: 'lg',
      shape: 'rounded-square',
      backgroundColor: 'auto',
      animated: true,
    },
    menu: {
      size: 'md',
      shape: 'circle',
      backgroundColor: 'transparent',
      animated: false,
    },
  },
};

// ==================== CLASSIC TEMPLATE ====================
export const CLASSIC_TEMPLATE: Partial<Theme> = {
  template: 'classic',
  typography: {
    restaurantName: {
      fontSize: '2.75rem',
      fontWeight: 'bold',
      fontFamily: 'Georgia, serif',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    sectionHeader: {
      fontSize: '1.625rem',
      fontWeight: 'bold',
      fontFamily: 'Georgia, serif',
      letterSpacing: '0.75px',
      textTransform: 'capitalize',
    },
    itemName: {
      fontSize: '1.125rem',
      fontWeight: 'semibold',
      fontFamily: 'Georgia, serif',
    },
    itemDescription: {
      fontSize: '0.875rem',
      fontWeight: 'normal',
      fontFamily: 'Georgia, serif',
    },
    price: {
      fontSize: '1.375rem',
      fontWeight: 'bold',
      fontFamily: 'Georgia, serif',
    },
  },
  buttons: {
    primary: {
      borderRadius: 'rounded-sm',
      shadow: 'shadow-lg',
      fontSize: '0.95rem',
      padding: 'px-8 py-3',
    },
    secondary: {
      borderRadius: 'rounded-sm',
      shadow: 'shadow-md',
      fontSize: '0.9rem',
      padding: 'px-6 py-2.5',
    },
    icon: {
      borderRadius: 'rounded-full',
      shadow: 'shadow-lg',
      fontSize: '1.1rem',
      padding: 'p-4',
    },
  },
  icons: {
    fab: {
      size: 'xl',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: false,
    },
    search: {
      size: 'md',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: false,
    },
    chat: {
      size: 'lg',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: false,
    },
    menu: {
      size: 'md',
      shape: 'circle',
      backgroundColor: 'transparent',
      animated: false,
    },
  },
};

// ==================== MINIMAL TEMPLATE ====================
export const MINIMAL_TEMPLATE: Partial<Theme> = {
  template: 'minimal',
  typography: {
    restaurantName: {
      fontSize: '2rem',
      fontWeight: 'semibold',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      letterSpacing: '0px',
      textTransform: 'none',
    },
    sectionHeader: {
      fontSize: '1.25rem',
      fontWeight: 'semibold',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      letterSpacing: '0px',
      textTransform: 'none',
    },
    itemName: {
      fontSize: '1rem',
      fontWeight: 'medium',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    itemDescription: {
      fontSize: '0.85rem',
      fontWeight: 'normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    price: {
      fontSize: '1.1rem',
      fontWeight: 'semibold',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  },
  buttons: {
    primary: {
      borderRadius: 'rounded-md',
      shadow: 'shadow-none',
      fontSize: '0.9rem',
      padding: 'px-4 py-2',
    },
    secondary: {
      borderRadius: 'rounded-md',
      shadow: 'shadow-none',
      fontSize: '0.85rem',
      padding: 'px-3 py-1.5',
    },
    icon: {
      borderRadius: 'rounded-md',
      shadow: 'shadow-none',
      fontSize: '1rem',
      padding: 'p-2',
    },
  },
  icons: {
    fab: {
      size: 'md',
      shape: 'square',
      backgroundColor: 'auto',
      animated: false,
    },
    search: {
      size: 'sm',
      shape: 'square',
      backgroundColor: 'auto',
      animated: false,
    },
    chat: {
      size: 'md',
      shape: 'square',
      backgroundColor: 'auto',
      animated: false,
    },
    menu: {
      size: 'sm',
      shape: 'square',
      backgroundColor: 'transparent',
      animated: false,
    },
  },
};

// ==================== VIBRANT TEMPLATE ====================
export const VIBRANT_TEMPLATE: Partial<Theme> = {
  template: 'vibrant',
  typography: {
    restaurantName: {
      fontSize: '3rem',
      fontWeight: 'bold',
      fontFamily: '"Impact", sans-serif',
      letterSpacing: '2px',
      textTransform: 'uppercase',
    },
    sectionHeader: {
      fontSize: '1.75rem',
      fontWeight: 'bold',
      fontFamily: '"Impact", sans-serif',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    itemName: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      fontFamily: '"Impact", sans-serif',
    },
    itemDescription: {
      fontSize: '0.9rem',
      fontWeight: 'normal',
      fontFamily: '"Impact", sans-serif',
    },
    price: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      fontFamily: '"Impact", sans-serif',
    },
  },
  buttons: {
    primary: {
      borderRadius: 'rounded-full',
      shadow: 'shadow-xl',
      fontSize: '1rem',
      padding: 'px-8 py-3',
    },
    secondary: {
      borderRadius: 'rounded-full',
      shadow: 'shadow-lg',
      fontSize: '0.95rem',
      padding: 'px-6 py-2.5',
    },
    icon: {
      borderRadius: 'rounded-full',
      shadow: 'shadow-xl',
      fontSize: '1.2rem',
      padding: 'p-4',
    },
  },
  icons: {
    fab: {
      size: 'xl',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: true,
    },
    search: {
      size: 'lg',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: true,
    },
    chat: {
      size: 'xl',
      shape: 'circle',
      backgroundColor: 'auto',
      animated: true,
    },
    menu: {
      size: 'lg',
      shape: 'circle',
      backgroundColor: 'transparent',
      animated: true,
    },
  },
};

// ==================== TEMPLATE REGISTRY ====================
export const TEMPLATES = {
  modern: MODERN_TEMPLATE,
  classic: CLASSIC_TEMPLATE,
  minimal: MINIMAL_TEMPLATE,
  vibrant: VIBRANT_TEMPLATE,
};

export type TemplateType = keyof typeof TEMPLATES;

export const TEMPLATE_NAMES: Record<TemplateType, string> = {
  modern: '🎨 Modern',
  classic: '📚 Classic',
  minimal: '⚪ Minimal',
  vibrant: '🌟 Vibrant',
};

export const TEMPLATE_DESCRIPTIONS: Record<TemplateType, string> = {
  modern: 'Clean, contemporary design with squared buttons and modern fonts',
  classic: 'Elegant serif fonts with traditional styling and circular icons',
  minimal: 'Simple, uncluttered interface with system fonts and minimalist design',
  vibrant: 'Bold, eye-catching design with rounded elements and animations',
};

// ==================== COLOR COMBINATIONS ====================
export interface ColorCombination {
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

// Modern Template Color Combinations
export const MODERN_COLORS: ColorCombination[] = [
  {
    name: 'Vibrant Orange',
    emoji: '🟠',
    primary: '#EA580C',
    secondary: '#FB923C',
    accent: '#FED7AA',
    background: '#FFFFFF',
  },
  {
    name: 'Tech Blue',
    emoji: '🔵',
    primary: '#0369A1',
    secondary: '#0EA5E9',
    accent: '#BAE6FD',
    background: '#FFFFFF',
  },
  {
    name: 'Eco Green',
    emoji: '🟢',
    primary: '#15803D',
    secondary: '#22C55E',
    accent: '#BBFB70',
    background: '#FFFFFF',
  },
  {
    name: 'Professional Gray',
    emoji: '⚪',
    primary: '#1F2937',
    secondary: '#4B5563',
    accent: '#D1D5DB',
    background: '#FFFFFF',
  },
];

// Classic Template Color Combinations
export const CLASSIC_COLORS: ColorCombination[] = [
  {
    name: 'Burgundy Elegance',
    emoji: '🍷',
    primary: '#7C2D12',
    secondary: '#EA580C',
    accent: '#FED7AA',
    background: '#FFFBF0',
  },
  {
    name: 'Gold Premium',
    emoji: '✨',
    primary: '#92400E',
    secondary: '#D97706',
    accent: '#FDE047',
    background: '#FFFFF8',
  },
  {
    name: 'Navy Formal',
    emoji: '🎩',
    primary: '#001F3F',
    secondary: '#003D82',
    accent: '#B3D9FF',
    background: '#F8FAFC',
  },
  {
    name: 'Plum Luxury',
    emoji: '💜',
    primary: '#581C87',
    secondary: '#A855F7',
    accent: '#E9D5FF',
    background: '#FFFAF0',
  },
];

// Minimal Template Color Combinations
export const MINIMAL_COLORS: ColorCombination[] = [
  {
    name: 'Clean Black',
    emoji: '⚫',
    primary: '#000000',
    secondary: '#404040',
    accent: '#E5E7EB',
    background: '#FFFFFF',
  },
  {
    name: 'Soft Gray',
    emoji: '🩶',
    primary: '#4B5563',
    secondary: '#6B7280',
    accent: '#D1D5DB',
    background: '#FCFCFC',
  },
  {
    name: 'Slate Subtle',
    emoji: '🫐',
    primary: '#334155',
    secondary: '#64748B',
    accent: '#CBD5E1',
    background: '#F8FAFC',
  },
  {
    name: 'Neutral Calm',
    emoji: '☁️',
    primary: '#42423D',
    secondary: '#78716B',
    accent: '#E7E5E4',
    background: '#FAFAF9',
  },
];

// Vibrant Template Color Combinations
export const VIBRANT_COLORS: ColorCombination[] = [
  {
    name: 'Sunset Fiesta',
    emoji: '🌅',
    primary: '#DC2626',
    secondary: '#F97316',
    accent: '#FBBF24',
    background: '#FFFBEB',
  },
  {
    name: 'Electric Pop',
    emoji: '⚡',
    primary: '#D946EF',
    secondary: '#EC4899',
    accent: '#34D399',
    background: '#FEF3F2',
  },
  {
    name: 'Cyber Neon',
    emoji: '💥',
    primary: '#0891B2',
    secondary: '#06B6D4',
    accent: '#F000FF',
    background: '#F0FDFF',
  },
  {
    name: 'Tropical Vibe',
    emoji: '🌴',
    primary: '#059669',
    secondary: '#14B8A6',
    accent: '#F59E0B',
    background: '#ECFDF5',
  },
];

// Get color combinations for a template
export function getTemplateColors(templateType: TemplateType): ColorCombination[] {
  const colorMap: Record<TemplateType, ColorCombination[]> = {
    modern: MODERN_COLORS,
    classic: CLASSIC_COLORS,
    minimal: MINIMAL_COLORS,
    vibrant: VIBRANT_COLORS,
  };
  return colorMap[templateType];
}

/**
 * Apply a template to a theme
 */
export function applyTemplate(theme: Theme, templateType: TemplateType): Theme {
  const template = TEMPLATES[templateType];
  return {
    ...theme,
    ...template,
    template: templateType,
  };
}

/**
 * Merge template styles with existing theme styles
 */
export function mergeTemplateStyles(theme: Theme, templateType: TemplateType): Theme {
  const template = TEMPLATES[templateType];
  return {
    ...theme,
    template: templateType,
    typography: {
      ...theme.typography,
      ...template.typography,
    },
    buttons: {
      ...theme.buttons,
      ...template.buttons,
    },
    icons: {
      ...theme.icons,
      ...template.icons,
    },
  };
}

/**
 * Get size multiplier for icons
 */
export function getIconSizeValue(size: 'sm' | 'md' | 'lg' | 'xl'): number {
  const sizes = { sm: 20, md: 28, lg: 36, xl: 48 };
  return sizes[size];
}

/**
 * Get border radius class name
 */
export function getBorderRadiusClass(radius: string): string {
  return radius;
}

/**
 * Get shadow class name
 */
export function getShadowClass(shadow: string): string {
  return shadow;
}
