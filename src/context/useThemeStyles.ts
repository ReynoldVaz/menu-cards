/**
 * Hook to get theme styles for use in components
 * Wraps getThemeStyles to provide theme colors to any component
 */

import { useRestaurant } from './useRestaurant';
import { getThemeStyles } from '../utils/themeUtils';

export function useThemeStyles() {
  const { theme } = useRestaurant();
  return getThemeStyles(theme || null);
}
