import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFirebaseRestaurant } from '../hooks/useFirebaseRestaurant';
import { RestaurantProvider } from '../context/RestaurantContext';
import App from '../App';
import { AnalyticsSummaryProvider } from '../context/AnalyticsSummaryContext';

export function RestaurantMenuPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Restaurant ID not found
          </h1>
          <p className="text-gray-600">Please use a valid menu link</p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantMenuInner restaurantId={restaurantId} />
  );
}

interface RestaurantMenuInnerProps {
  restaurantId: string;
}

function RestaurantMenuInner({ restaurantId }: RestaurantMenuInnerProps) {
    const [analyticsSummary, setAnalyticsSummary] = useState<Record<string, number> | null>(null);
    useEffect(() => {
      if (!restaurantId) return;
      fetch(`/api/analytics?restaurantId=${encodeURIComponent(restaurantId)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`Analytics error ${res.status}`);
          const data = await res.json();
          setAnalyticsSummary(data);
          console.debug('GA4 analytics summary:', data);
          if (typeof window !== 'undefined' && window.console) {
            window.console.log('GA4 analytics summary:', data);
          }
        })
        .catch((err) => {
          console.debug('Analytics fetch failed:', err?.message || err);
          if (typeof window !== 'undefined' && window.console) {
            window.console.error('Analytics fetch failed:', err?.message || err);
          }
        });
    }, [restaurantId]);
  const {
    restaurant,
    menuSections,
    todaysSpecial,
    upcomingEvents,
    loading,
    error,
  } = useFirebaseRestaurant(restaurantId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Menu Not Found
          </h1>
          <p className="text-gray-600 mb-2">
            {error || "The restaurant menu couldn't be loaded"}
          </p>
          <p className="text-sm text-gray-500">
            Please check your QR code or link and try again
          </p>
        </div>
      </div>
    );
  }

  return (
    <RestaurantProvider
      value={{
        restaurant,
        theme: restaurant?.theme || null,
        menuSections,
        todaysSpecial,
        upcomingEvents,
        loading,
        error,
      }}
    >
      <AnalyticsSummaryProvider>
        <App analyticsSummary={analyticsSummary} />
      </AnalyticsSummaryProvider>
    </RestaurantProvider>
  );
}
