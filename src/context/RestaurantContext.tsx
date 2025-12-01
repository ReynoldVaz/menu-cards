import { createContext, ReactNode } from 'react';
import type { MenuItem, MenuSection, Event } from '../data/menuData';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';

export interface RestaurantContextType {
  restaurant: Restaurant | null;
  menuSections: MenuSection[];
  todaysSpecial: MenuItem | null;
  upcomingEvents: Event[];
  loading: boolean;
  error?: string;
}

export const RestaurantContext = createContext<RestaurantContextType | undefined>(
  undefined
);

interface RestaurantProviderProps {
  children: ReactNode;
  value: RestaurantContextType;
}

export function RestaurantProvider({
  children,
  value,
}: RestaurantProviderProps) {
  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}
