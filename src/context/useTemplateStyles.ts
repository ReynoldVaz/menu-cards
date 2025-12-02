/**
 * Hook to get template component styles
 * Provides template-aware styling for UI elements
 */

import { useRestaurant } from './useRestaurant';
import { getTemplateComponentStyles } from '../utils/themeUtils';

export function useTemplateStyles() {
  const { theme } = useRestaurant();
  return getTemplateComponentStyles(theme || null);
}
