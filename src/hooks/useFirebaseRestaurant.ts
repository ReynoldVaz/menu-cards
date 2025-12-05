import { useCallback, useEffect, useState } from 'react';
import { db } from '../firebase.config';
import {
  doc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import type { MenuItem, MenuSection, Event } from '../data/menuData';

export interface TypographyStyle {
  fontSize: string;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  fontFamily?: string;
  letterSpacing?: string;
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none';
}

export interface ButtonStyle {
  borderRadius: 'rounded' | 'rounded-full' | 'rounded-lg' | 'rounded-md' | 'rounded-sm' | 'rounded-none';
  shadow: 'shadow-none' | 'shadow-sm' | 'shadow-md' | 'shadow-lg' | 'shadow-xl';
  fontSize: string;
  padding: string;
}

export interface IconStyle {
  size: 'sm' | 'md' | 'lg' | 'xl';
  shape: 'circle' | 'square' | 'rounded-square';
  backgroundColor?: string;
  animated?: boolean;
  shadow?: 'shadow-none' | 'shadow-sm' | 'shadow-md' | 'shadow-lg' | 'shadow-xl';
}

export interface Theme {
  mode: 'light' | 'dark' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  template?: 'modern' | 'classic' | 'minimal' | 'vibrant' | 'custom';
  typography?: {
    restaurantName?: TypographyStyle;
    sectionHeader?: TypographyStyle;
    itemName?: TypographyStyle;
    itemDescription?: TypographyStyle;
    price?: TypographyStyle;
  };
  buttons?: {
    primary?: ButtonStyle;
    secondary?: ButtonStyle;
    icon?: ButtonStyle;
  };
  icons?: {
    fab?: IconStyle;
    search?: IconStyle;
    chat?: IconStyle;
    menu?: IconStyle;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  image?: string;
  cuisine?: string[];
  isActive: boolean;
  logo?: string;
  theme?: Theme;
  restaurantCode?: string;
  ownerId?: string;
  menuSectionNames?: string[];
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  googleReviews?: string;
  contactPhone?: string;
  captureCustomerPhone?: boolean;
  enableAnalytics?: boolean;
}

export interface UseFirebaseRestaurantResult {
  restaurant: Restaurant | null;
  menuSections: MenuSection[];
  todaysSpecial: MenuItem | null;
  upcomingEvents: Event[];
  loading: boolean;
  error?: string;
  refresh: () => void;
}

export function useFirebaseRestaurant(
  restaurantId: string
): UseFirebaseRestaurantResult {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuSections, setMenuSections] = useState<MenuSection[]>([]);
  const [todaysSpecial, setTodaysSpecial] = useState<MenuItem | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetchMenuItems = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const menuCollectionRef = collection(
        db,
        `restaurants/${restaurantId}/menu_items`
      );
      const querySnap = await getDocs(menuCollectionRef);

      const items: MenuItem[] = querySnap.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as MenuItem[];

      // Find today's special
      const special =
        items.find((item) => item.is_todays_special) || null;
      setTodaysSpecial(special || null);

      // Group items by section
      const sectionMap = new Map<string, MenuItem[]>();
      items.forEach((item) => {
        const section = item.section || 'Menu';
        if (!sectionMap.has(section)) {
          sectionMap.set(section, []);
        }
        sectionMap.get(section)!.push(item);
      });

      const sections: MenuSection[] = Array.from(sectionMap.entries()).map(
        ([title, items], idx) => ({
          id: `section-${idx}-${title.replace(/\s+/g, '-')}`,
          title,
          items,
        })
      );

      setMenuSections(sections);
    } catch (err) {
      console.error('Failed to fetch menu items:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch menu items'
      );
    }
  }, [restaurantId]);

  const fetchEvents = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const eventsCollectionRef = collection(
        db,
        `restaurants/${restaurantId}/events`
      );
      const querySnap = await getDocs(eventsCollectionRef);

      const eventsData: Event[] = querySnap.docs.map((docSnap: any) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Event[];

      setUpcomingEvents(eventsData);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setError('Restaurant ID not provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);

    // Set up real-time listener for restaurant document
    const restaurantDocRef = doc(db, 'restaurants', restaurantId);
    const unsubscribe = onSnapshot(
      restaurantDocRef,
      (docSnap: any) => {
        if (docSnap.exists()) {
          setRestaurant({
            id: docSnap.id,
            ...docSnap.data(),
          } as Restaurant);
        } else {
          setError('Restaurant not found');
          setRestaurant(null);
        }
      },
      (err: any) => {
        console.error('Error fetching restaurant:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch restaurant'
        );
      }
    );

    // Fetch menu and events
    const initializeData = async () => {
      await fetchMenuItems();
      await fetchEvents();
      setLoading(false);
    };

    initializeData();

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [restaurantId, fetchMenuItems, fetchEvents]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchMenuItems();
    await fetchEvents();
    setLoading(false);
  }, [fetchMenuItems, fetchEvents]);

  return {
    restaurant,
    menuSections,
    todaysSpecial,
    upcomingEvents,
    loading,
    error,
    refresh,
  };
}
