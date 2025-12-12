import { useState, useEffect } from 'react';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';

export function usePhoneOptIn(restaurant: Restaurant | null) {
  const [showOptIn, setShowOptIn] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    
    const shouldPrompt = restaurant.captureCustomerPhone;
    const alreadyOpted = localStorage.getItem('customerPhoneOptIn') === 'true';
    const skipped = localStorage.getItem('customerPhoneOptOut') === 'true';
    
    if (shouldPrompt && !alreadyOpted && !skipped) {
      setShowOptIn(true);
    }
  }, [restaurant]);

  const closeOptIn = () => setShowOptIn(false);

  return { showOptIn, closeOptIn };
}
