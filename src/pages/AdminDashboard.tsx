import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { ExitConfirmDialog } from '../components/ExitConfirmDialog';

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
  const [loading, setLoading] = useState(true); // Start with true to prevent flash
  const [error, setError] = useState<string>('');
  const [authChecked, setAuthChecked] = useState(false); // Track if auth check is complete
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const location = useLocation();

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
          navigate('/', { replace: true }); // Redirect to landing page
          return;
        }
        setAuthChecked(true); // Auth is valid, allow rendering
        await loadRestaurant();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [searchParams]);

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      
      // Show confirmation dialog
      setShowExitDialog(true);
      
      // Push current state back to prevent immediate navigation
      window.history.pushState(null, '', location.pathname + location.search);
    };

    // Push initial state
    window.history.pushState(null, '', location.pathname + location.search);
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname, location.search]);

  // Intercept clicks on links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        // Skip links that open in new tab/window
        if (link.target === '_blank' || link.target === '_new') {
          return;
        }
        
        const url = new URL(link.href);
        const currentPath = window.location.pathname;
        
        // Check if navigating away from dashboard
        if (url.pathname !== currentPath && currentPath === '/admin/dashboard') {
          e.preventDefault();
          setPendingNavigation(url.pathname + url.search + url.hash);
          setShowExitDialog(true);
        }
      }
    };
    
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const handleExitConfirm = useCallback(() => {
    setShowExitDialog(false);
    
    if (pendingNavigation) {
      // Navigate to pending destination
      navigate(pendingNavigation, { replace: true });
      setPendingNavigation(null);
    } else {
      // Handle browser back button - navigate to landing page
      navigate('/', { replace: true });
    }
  }, [pendingNavigation, navigate]);

  const handleExitCancel = useCallback(() => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  }, []);

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
          enableWhatsAppMarketing: restaurantData.enableWhatsAppMarketing ?? false,
        } as Restaurant);
      } else {
        setError('Restaurant not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
    }
  }

  // Don't render anything until auth is checked to prevent flash
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ExitConfirmDialog 
        isOpen={showExitDialog}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.7),inset_2px_2px_5px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 drop-shadow-sm"> Menu Cards Admin</h1>
          <p className="text-gray-600 mt-1">Manage your restaurants and menus</p>
        </div>
      </div>

      {/* Mobile Tabs Bar (non-sticky as requested) */}
      <div className="lg:hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`basis-[calc(50%-0.25rem)] px-3 py-2 rounded-2xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.2),inset_2px_2px_4px_rgba(0,0,0,0.2)]'
                  : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] hover:shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.9)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.9)]'
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
            <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-1">
              {/* Navigation Tabs */}
              <div className="space-y-1 p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 font-medium transition-all duration-200 rounded-xl ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[inset_-2px_-2px_4px_rgba(255,255,255,0.2),inset_2px_2px_4px_rgba(0,0,0,0.2)]'
                        : 'text-gray-700 hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)] active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.1),inset_-3px_-3px_6px_rgba(255,255,255,0.7)]'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Current Restaurant Info */}
              {restaurant && (
                <div className="p-4 mt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3">My Restaurant</h3>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]">
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
              <div className="bg-gradient-to-br from-red-100 to-red-50 text-red-700 px-6 py-4 rounded-2xl mb-4 shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.5)]">
                {error}
              </div>
            )}

            {loading ? (
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-8 text-center">
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
                {activeTab === 'subscribers' && <SubscribersTab restaurant={restaurant} onUpdate={loadUserRestaurant} />}

                {/* QR Tab */}
                {activeTab === 'qr' && <QRTab restaurant={restaurant} />}
              </>
            ) : (
              <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-8 text-center">
                <p className="text-gray-600">Restaurant not found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
