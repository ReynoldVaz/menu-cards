import { useState, useEffect } from 'react';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';

export function usePhoneOptIn(restaurant: Restaurant | null) {
  const [showOptIn, setShowOptIn] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    
    const shouldPrompt = restaurant.captureCustomerPhone;
    // Restaurant-specific localStorage keys
    const alreadyOpted = localStorage.getItem(`customerPhoneOptIn_${restaurant.id}`) === 'true';
    const skipped = localStorage.getItem(`customerPhoneOptOut_${restaurant.id}`) === 'true';
    
    if (shouldPrompt && !alreadyOpted && !skipped) {
      setShowOptIn(true);
    }
  }, [restaurant]);

  const closeOptIn = () => setShowOptIn(false);

  return { showOptIn, closeOptIn };
}
