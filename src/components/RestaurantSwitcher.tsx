import { useState } from 'react';

interface Restaurant {
  id: string;
  name: string;
  restaurantCode: string;
  ownerId: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

interface RestaurantSwitcherProps {
  restaurants: Restaurant[];
  currentRestaurantCode: string | null;
  onSelect: (restaurantCode: string) => void;
}

export function RestaurantSwitcher({
  restaurants,
  currentRestaurantCode,
  onSelect,
}: RestaurantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentRestaurant = restaurants.find(
    (r) => r.restaurantCode === currentRestaurantCode
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
      >
        🏪 {currentRestaurant?.name || 'Select Restaurant'}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Switch Restaurant</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {restaurants.map((restaurant) => (
                <button
                  key={restaurant.id}
                  onClick={() => {
                    onSelect(restaurant.restaurantCode);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentRestaurantCode === restaurant.restaurantCode
                      ? 'bg-orange-100 border-l-4 border-orange-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{restaurant.name}</p>
                      <p className="text-sm text-gray-600">{restaurant.restaurantCode}</p>
                      {restaurant.email && (
                        <p className="text-xs text-gray-500">{restaurant.email}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        restaurant.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {restaurant.isActive ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
