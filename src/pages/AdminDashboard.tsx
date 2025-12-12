import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, auth } from '../firebase.config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { RestaurantsTab } from './admin/RestaurantsTab';
import { MenuTab } from './admin/MenuTab';
import { EventsTab } from './admin/EventsTab';
import { SettingsTab } from './admin/SettingsTab';
import { QRTab } from './admin/QRTab';
import { SubscribersTab } from './admin/SubscribersTab';

interface AdminDashboardTab {
  id: 'restaurants' | 'menu' | 'events' | 'settings' | 'qr' | 'subscribers';
  label: string;
  icon: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<AdminDashboardTab['id']>('restaurants');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const tabs: AdminDashboardTab[] = [
    { id: 'restaurants', label: 'Restaurant', icon: '' },
    { id: 'settings', label: 'Settings', icon: '' },
    { id: 'menu', label: 'Menu Items', icon: '' },
    { id: 'events', label: 'Events', icon: '' },
    { id: 'qr', label: 'QR Code', icon: '' },
    { id: 'subscribers', label: 'Subscribers', icon: '' },
  ];

  // Load current user's restaurant or query parameter restaurant, but wait for auth
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        setLoading(true);
        const user = await ensureAuth();
        if (cancelled) return;
        if (!user) {
          setError('Not authenticated');
          navigate('/admin/auth');
          return;
        }
        await loadRestaurant();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [searchParams]);

  function ensureAuth(): Promise<User | null> {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        resolve(u);
      });
    });
  }

  async function loadRestaurant() {
    try {
      const currentUser = auth.currentUser || (await ensureAuth());
      if (!currentUser) return; // navigation handled by caller

      // Check if restaurant code is passed as query parameter (from master admin)
      const restaurantCode = searchParams.get('restaurant');
      
      if (restaurantCode) {
        // Load specified restaurant (for master admin)
        await loadRestaurantByCode(restaurantCode);
      } else {
        // Load user's own restaurant (for regular owner)
        await loadUserRestaurant();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  }

  async function loadUserRestaurant() {
    try {
      const currentUser = auth.currentUser || (await ensureAuth());
      if (!currentUser) return; // navigation handled by caller

      // Get user document to find their restaurant code
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
      
      if (userSnapshot.empty) {
        setError('User data not found');
        return;
      }

      const userData = userSnapshot.docs[0].data() as { restaurantCode: string };
      const code = userData.restaurantCode;

      await loadRestaurantByCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
    }
  }

  async function loadRestaurantByCode(restaurantCode: string) {
    try {
      // Get restaurant document using the code
      const restaurantSnapshot = await getDocs(query(collection(db, 'restaurants'), where('restaurantCode', '==', restaurantCode)));
      
      if (!restaurantSnapshot.empty) {
        const docSnap = restaurantSnapshot.docs[0];
        const restaurantData = docSnap.data();
        setRestaurant({
          id: docSnap.id, // Use Firestore doc id for paths
          name: restaurantData.name,
          restaurantCode: restaurantData.restaurantCode,
          ownerId: restaurantData.ownerId,
          phone: restaurantData.phone,
          email: restaurantData.email,
          address: restaurantData.address,
          description: restaurantData.description,
          logo: restaurantData.logo,
          theme: restaurantData.theme,
          // Social + public links
          instagram: restaurantData.instagram,
          facebook: restaurantData.facebook,
          youtube: restaurantData.youtube,
          website: restaurantData.website,
          googleReviews: restaurantData.googleReviews,
          contactPhone: restaurantData.contactPhone,
          isActive: restaurantData.isActive,
          createdAt: restaurantData.createdAt,
          updatedAt: restaurantData.updatedAt,
          captureCustomerPhone: restaurantData.captureCustomerPhone,
          enableAnalytics: restaurantData.enableAnalytics ?? false,
        } as Restaurant);
      } else {
        setError('Restaurant not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800"> Menu Cards Admin</h1>
          <p className="text-gray-600 mt-1">Manage your restaurants and menus</p>
        </div>
      </div>

      {/* Mobile Tabs Bar (non-sticky as requested) */}
      <div className="lg:hidden bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`basis-[calc(50%-0.25rem)] px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-lg shadow">
              {/* Navigation Tabs */}
              <div className="border-b">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Current Restaurant Info */}
              {restaurant && (
                <div className="p-4 border-t">
                  <h3 className="text-sm font-bold text-gray-800 mb-2">My Restaurant</h3>
                  <div className="bg-blue-50 rounded p-3">
                    <div className="font-semibold text-gray-800 truncate">{restaurant.name}</div>
                    <div className="text-xs text-gray-600 mt-1">Code: {restaurant.id}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : restaurant ? (
              <>
                {/* Restaurants Tab */}
                {activeTab === 'restaurants' && <RestaurantsTab restaurant={restaurant} />}

                {/* Menu Tab */}
                {activeTab === 'menu' && <MenuTab restaurantId={restaurant.id} />}

                {/* Events Tab */}
                {activeTab === 'events' && <EventsTab restaurantId={restaurant.id} />}

                {/* Settings Tab */}
                {activeTab === 'settings' && <SettingsTab restaurant={restaurant} onUpdate={loadUserRestaurant} />}

                {/* Subscribers Tab */}
                {activeTab === 'subscribers' && <SubscribersTab restaurant={restaurant} />}

                {/* QR Tab */}
                {activeTab === 'qr' && <QRTab restaurant={restaurant} />}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Restaurant not found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
