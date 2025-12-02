import { useContext } from 'react';
import { RestaurantContext } from './RestaurantContext';

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
}
