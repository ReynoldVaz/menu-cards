import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, auth } from '../firebase.config';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, deleteDoc, getDoc, deleteField } from 'firebase/firestore';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { MenuItem, Event } from '../data/menuData';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { MenuItemForm, type MenuItemFormData } from '../components/MenuItemForm';
import { EventForm, type EventFormData } from '../components/EventForm';
import { ThemePreview } from '../components/ThemePreview';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { BulkUploadMenu } from '../components/BulkUploadMenu';
import { TEMPLATES, TEMPLATE_NAMES, TEMPLATE_DESCRIPTIONS, getTemplateColors, type TemplateType } from '../utils/templateStyles';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { formatPrice } from '../utils/formatPrice';

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
    { id: 'restaurants', label: 'Restaurant', icon: '🏪' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'menu', label: 'Menu Items', icon: '🍽️' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'qr', label: 'QR Code', icon: '📱' },
    { id: 'subscribers', label: 'Subscribers', icon: '👥' },
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
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Menu Cards Admin</h1>
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
function SubscribersTab({ restaurant }: { restaurant: Restaurant }) {
  const [subscribers, setSubscribers] = useState<Array<{ id: string; phone: string; originalInput?: string; createdAt?: any }>>([]);

  useEffect(() => {
    const ref = collection(db, `restaurants/${restaurant.id}/subscribers`);
    getDocs(ref).then((snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSubscribers(list);
    }).catch((err) => {
      console.error('Failed to load subscribers:', err);
    });
  }, [restaurant.id]);

  function downloadCsv() {
    const rows = subscribers.map((s) => ({
      phone: s.phone,
      originalInput: s.originalInput || '',
      createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : '',
    }));
    const header = ['phone','originalInput','createdAt'];
    const csv = [header.join(','), ...rows.map(r => `${r.phone},${r.originalInput},${r.createdAt}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${restaurant.name.replace(/[^a-z0-9]+/gi,'-')}-subscribers.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Subscribers ({subscribers.length})</h2>
        <button onClick={downloadCsv} className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black text-sm">Download CSV</button>
      </div>
      {subscribers.length === 0 ? (
        <p className="text-gray-600">No subscribers yet.</p>
      ) : (
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">Original Input</th>
                <th className="text-left px-3 py-2">Opt-in Date</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{s.phone}</td>
                  <td className="px-3 py-2">{s.originalInput || ''}</td>
                  <td className="px-3 py-2">{s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * QR Tab
 */
function QRTab({ restaurant }: { restaurant: Restaurant }) {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://menu-cards.vercel.app';
  const menuLink = `${appUrl}/r/${restaurant.id}`;

  function copyMenuLink() {
    navigator.clipboard.writeText(menuLink).catch(() => {
      alert('Copy failed. Please copy manually.');
    });
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">QR Code</h2>
      <p className="text-sm text-gray-600 mb-4">Share or download your menu QR code below.</p>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-1 w-full">
          <QRCodeGenerator restaurantId={restaurant.id} restaurantName={restaurant.name} />
          <div className="mt-4">
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded font-mono text-sm break-all">{menuLink}</div>
            <div className="mt-3 flex gap-3">
              <button onClick={copyMenuLink} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">Copy Link</button>
              <a href={menuLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-black text-sm">Open Menu</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Restaurants Tab
 */
function RestaurantsTab({ restaurant }: { restaurant: Restaurant }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Details</h2>
      <p className="-mt-4 mb-4 text-sm text-gray-500">To edit these details, go to the Settings tab.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.name}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 font-mono text-sm">{restaurant.id}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.description || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 whitespace-nowrap overflow-x-auto text-sm">{restaurant.phone || 'N/A'}</p>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50 break-words text-sm">{restaurant.email || 'N/A'}</p>
        </div>

        {/* QR Code moved to Settings tab */}
      </div>
    </div>
  );
}

/**
 * Menu Tab
 */
function MenuTab({ restaurantId }: { restaurantId: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSectionsState] = useState<string[]>(['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups', 'Breads']);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  useEffect(() => {
    loadMenuItems();
    loadRestaurantSections();
  }, [restaurantId]);

  async function loadRestaurantSections() {
    try {
      const restaurantDoc = await getDoc(doc(db, `restaurants/${restaurantId}`));
      if (restaurantDoc.exists()) {
        const data = restaurantDoc.data();
        if (data.menuSectionNames && Array.isArray(data.menuSectionNames)) {
          setSectionsState(data.menuSectionNames);
        }
      }
    } catch (err) {
      console.error('Failed to load restaurant sections:', err);
    }
  }

  async function updateRestaurantSections(newSections: string[]) {
    try {
      await updateDoc(doc(db, `restaurants/${restaurantId}`), {
        menuSectionNames: newSections,
      });
    } catch (err) {
      console.error('Failed to update restaurant sections:', err);
    }
  }

  async function loadMenuItems() {
    try {
      setLoading(true);
      const snapshot = await getDocs(
        collection(db, `restaurants/${restaurantId}/menu_items`)
      );
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MenuItem[];
      setItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem(formData: MenuItemFormData) {
    try {
      setSavingItem(true);
      // Convert price to string for storage consistency
      const menuItemData: any = {
        ...formData,
        price: String(formData.price),
        is_new: Boolean((formData as any).is_new),
        is_unavailable: Boolean((formData as any).is_unavailable),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Convert spice_level to spice and sweet_level to sweet
      if ((formData as any).spice_level) {
        menuItemData.spice = (formData as any).spice_level;
        delete menuItemData.spice_level;
      }
      if ((formData as any).sweet_level) {
        menuItemData.sweet = (formData as any).sweet_level;
        delete menuItemData.sweet_level;
      }
      
      const docRef = await addDoc(
        collection(db, `restaurants/${restaurantId}/menu_items`),
        menuItemData
      );
      
      // Add to local state
      setItems([
        ...items,
        {
          id: docRef.id,
          ...menuItemData,
        } as unknown as MenuItem,
      ]);
      
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add menu item:', err);
    } finally {
      setSavingItem(false);
    }
  }

  async function handleUpdateItem(formData: MenuItemFormData) {
    if (!editingItem?.id) return;

    try {
      setSavingItem(true);
      const menuItemData: any = {
        ...formData,
        price: String(formData.price),
        is_new: Boolean((formData as any).is_new),
        is_unavailable: Boolean((formData as any).is_unavailable),
        updatedAt: new Date().toISOString(),
      };

      // Convert spice_level to spice and sweet_level to sweet
      if ((formData as any).spice_level) {
        menuItemData.spice = (formData as any).spice_level;
        delete menuItemData.spice_level;
      }
      if ((formData as any).sweet_level) {
        menuItemData.sweet = (formData as any).sweet_level;
        delete menuItemData.sweet_level;
      }

      await updateDoc(
        doc(db, `restaurants/${restaurantId}/menu_items/${editingItem.id}`),
        menuItemData
      );

      // Update local state
      setItems(
        items.map((item) =>
          item.id === editingItem.id
            ? ({ ...item, ...menuItemData } as unknown as MenuItem)
            : item
        )
      );

      setEditingItem(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update menu item:', err);
    } finally {
      setSavingItem(false);
    }
  }

  // Global search: substring match across key fields
  const filteredItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const fields = [
      item.name,
      item.section,
      typeof item.price === 'string' ? item.price : String(item.price),
      (item as any).ingredients ? ((item as any).ingredients as any).toString() : '',
      (item as any).dietType || '',
    ].map((v) => (v ? String(v).toLowerCase() : ''));
    return fields.some((v) => v.includes(q));
  });

  async function handleDeleteItem(itemId: string | undefined) {
    if (!itemId || !confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, `restaurants/${restaurantId}/menu_items/${itemId}`));
      setItems(items.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  }

  async function handleBulkUpload(bulkItems: MenuItemFormData[]) {
    try {
      setSavingItem(true);
      const createdItems: MenuItem[] = [];

      for (const formData of bulkItems) {
        const menuItemData: any = {
          ...formData,
          price: String(formData.price),
          is_new: Boolean((formData as any).is_new),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Convert spice_level to spice and sweet_level to sweet
        if ((formData as any).spice_level) {
          menuItemData.spice = (formData as any).spice_level;
          delete menuItemData.spice_level;
        }
        if ((formData as any).sweet_level) {
          menuItemData.sweet = (formData as any).sweet_level;
          delete menuItemData.sweet_level;
        }

        // Remove undefined values to prevent Firestore errors
        Object.keys(menuItemData).forEach(key => {
          if (menuItemData[key] === undefined) {
            delete menuItemData[key];
          }
        });

        const docRef = await addDoc(
          collection(db, `restaurants/${restaurantId}/menu_items`),
          menuItemData
        );

        createdItems.push({
          id: docRef.id,
          ...menuItemData,
        } as unknown as MenuItem);
      }

      // Add all new items to local state
      setItems([...items, ...createdItems]);
      alert(`✅ Successfully imported ${createdItems.length} items!`);
    } catch (err) {
      console.error('Failed to bulk upload items:', err);
      alert(`❌ Error importing items: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">Menu Items ({items.length})</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-4 py-2 bg-gray-800 hover:bg-black text-white rounded font-medium"
              >
                ⬆️ Bulk Import
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
              >
                ➕ Add Item
              </button>
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items (name, section, ingredients...)"
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {showBulkUpload && (
            <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Bulk Import</h3>
                <button onClick={() => setShowBulkUpload(false)} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
              </div>
              <BulkUploadMenu onUpload={handleBulkUpload} isLoading={savingItem} />
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No menu items yet. Click "Add Item" to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Section</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Veg</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Special</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 sm:px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{item.section}</td>
                      <td className="px-3 sm:px-4 py-3">{formatPrice(item.price, (item as any).currency)}</td>
                      <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{(item as any).is_vegetarian ? '🌱' : '-'}</td>
                      <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{item.is_todays_special ? '⭐' : '-'}</td>
                      <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowForm(true);
                          }}
                          className="text-blue-600 hover:underline text-xs mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <MenuItemForm
            restaurantCode={restaurantId}
            availableSections={sections}
            onSectionsUpdate={(newSections) => {
              setSectionsState(newSections);
              updateRestaurantSections(newSections);
            }}
            initialData={editingItem ? {
              name: editingItem.name,
              description: editingItem.description,
              price: typeof editingItem.price === 'string' ? parseFloat(editingItem.price) : editingItem.price,
              section: editingItem.section || '',
              ingredients: typeof editingItem.ingredients === 'string' ? editingItem.ingredients : editingItem.ingredients?.join(', ') || '',
              image: editingItem.image,
              images: (editingItem as any).images,
              video: editingItem.video,
              videos: (editingItem as any).videos,
              dietType: (editingItem as any).dietType,
              is_todays_special: editingItem.is_todays_special || false,
              is_unavailable: Boolean((editingItem as any).is_unavailable),
              spice_level: (editingItem as any).spice || (editingItem as any).spice_level,
              sweet_level: (editingItem as any).sweet || (editingItem as any).sweet_level,
            } : undefined}
            onSubmit={editingItem ? handleUpdateItem : handleAddItem}
            onCancel={() => {
              setShowForm(false);
              setEditingItem(null);
            }}
            isLoading={savingItem}
          />
        </>
      )}
    </div>
  );
}

/**
 * Events Tab
 */
function EventsTab({ restaurantId }: { restaurantId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    loadEvents();
  }, [restaurantId]);

  async function loadEvents() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, `restaurants/${restaurantId}/events`));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddEvent(formData: EventFormData) {
    try {
      setSavingEvent(true);
      const docRef = await addDoc(collection(db, `restaurants/${restaurantId}/events`), {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Add to local state
      setEvents([
        ...events,
        {
          id: docRef.id,
          ...formData,
        } as unknown as Event,
      ]);

      setShowForm(false);
    } catch (err) {
      console.error('Failed to add event:', err);
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleUpdateEvent(formData: EventFormData) {
    if (!editingEvent?.id) return;

    try {
      setSavingEvent(true);
      const eventData: any = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };
      if (!formData.image) {
        eventData.image = deleteField();
      }

      await updateDoc(
        doc(db, `restaurants/${restaurantId}/events/${editingEvent.id}`),
        eventData
      );

      // Update local state
      setEvents(
        events.map((event) =>
          event.id === editingEvent.id
            ? ({ ...event, ...eventData } as unknown as Event)
            : event
        )
      );

      setEditingEvent(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update event:', err);
    } finally {
      setSavingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string | undefined) {
    if (!eventId || !confirm('Are you sure you want to delete this event?')) return;

    try {
      await deleteDoc(doc(db, `restaurants/${restaurantId}/events/${eventId}`));
      setEvents(events.filter((event) => event.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Events ({events.length})</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              ➕ Add Event
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : events.length === 0 ? (
            <p className="text-gray-600">No events yet. Click "Add Event" to get started!</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{event.title}</h3>
                      <p className="text-sm text-gray-600">
                        📅 {event.date} at 🕐 {event.time}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                      {(event as any).image && (
                        <img
                          src={(event as any).image}
                          alt={event.title}
                          className="w-24 h-24 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setShowForm(true);
                        }}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <EventForm
            restaurantCode={restaurantId}
            initialData={
              editingEvent
                ? {
                    title: editingEvent.title,
                    date: editingEvent.date,
                    time: editingEvent.time,
                    description: editingEvent.description,
                    image: (editingEvent as any).image || '',
                  }
                : undefined
            }
            onSubmit={editingEvent ? handleUpdateEvent : handleAddEvent}
            onCancel={() => {
              setShowForm(false);
              setEditingEvent(null);
            }}
            isLoading={savingEvent}
          />
        </>
      )}
    </div>
  );
}

/**
 * Settings Tab
 */
function SettingsTab({ restaurant, onUpdate }: { restaurant: Restaurant; onUpdate: () => void }) {
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description || '');
  const [phone, setPhone] = useState(restaurant.phone || '');
  const [contactPhone, setContactPhone] = useState(restaurant.contactPhone || '');
  const [email, setEmail] = useState(restaurant.email || '');
  const [instagram, setInstagram] = useState(restaurant.instagram || '');
  const [facebook, setFacebook] = useState(restaurant.facebook || '');
  const [youtube, setYoutube] = useState(restaurant.youtube || '');
  const [website, setWebsite] = useState(restaurant.website || '');
  const [googleReviews, setGoogleReviews] = useState(restaurant.googleReviews || '');
  const [captureCustomerPhone, setCaptureCustomerPhone] = useState<boolean>(restaurant.captureCustomerPhone || false);
  const [themeMode, setThemeMode] = useState(restaurant.theme?.mode || 'custom');
  const [primaryColor, setPrimaryColor] = useState(restaurant.theme?.primaryColor || '#EA580C');
  const [secondaryColor, setSecondaryColor] = useState(restaurant.theme?.secondaryColor || '#FB923C');
  const [accentColor, setAccentColor] = useState(restaurant.theme?.accentColor || '#FED7AA');
  const [backgroundColor, setBackgroundColor] = useState(restaurant.theme?.backgroundColor || '#FFFFFF');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (restaurant.theme?.template as TemplateType) || 'modern'
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string>('');
  const [approvedThemes, setApprovedThemes] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(restaurant.logo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [contactPhoneError, setContactPhoneError] = useState<string>('');

  // QR: moved to QR tab
  function isValidPhone(input: string) {
    if (!input) return true; // allow empty
    const cleaned = input.replace(/[^0-9]/g, '');
    if (cleaned.length < 10) return false; // require at least 10 digits
    return /^[+0-9 ()-]+$/.test(input);
  }

  function handlePhoneChange(value: string) {
    setPhone(value);
    setPhoneError(isValidPhone(value) ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
  }

  function handleContactPhoneChange(value: string) {
    setContactPhone(value);
    setContactPhoneError(isValidPhone(value) ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
  }

  // Load approved custom themes for this restaurant
  useEffect(() => {
    async function loadApprovedThemes() {
      try {
        const themeReqRef = collection(db, 'theme_requests');
        const q = query(
          themeReqRef,
          where('restaurantCode', '==', restaurant.restaurantCode),
          where('status', '==', 'approved')
        );
        const snapshot = await getDocs(q);
        const themes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApprovedThemes(themes);
      } catch (err) {
        console.error('Failed to load approved themes:', err);
      }
    }

    if (restaurant.restaurantCode) {
      loadApprovedThemes();
    }
  }, [restaurant.restaurantCode]);


  const templateColors = getTemplateColors(selectedTemplate);

  const currentTheme = {
    mode: themeMode as 'light' | 'dark' | 'custom',
    primaryColor,
    secondaryColor,
    accentColor,
    backgroundColor,
    template: selectedTemplate,
    ...TEMPLATES[selectedTemplate],
  };

  async function handleSave() {
    try {
      setSaving(true);
      
      let logoUrl = logoPreview;
      
      // Upload logo if a new file was selected
      if (logoFile) {
        setUploadingLogo(true);
        const result = await uploadToCloudinary(logoFile, {
          restaurantCode: restaurant.restaurantCode || '',
          fileType: 'logo',
        });
        logoUrl = result.url;
        setUploadingLogo(false);
      }
      const updates: any = {
        name,
        description,
        phone,
        email,
        theme: currentTheme,
      };
      if (logoFile && logoUrl) {
        updates.logo = logoUrl;
      } else if (removeLogo) {
        updates.logo = deleteField();
      }

      await updateDoc(doc(db, 'restaurants', restaurant.id), updates);
      onUpdate();
      setSavedNotice('Saved successfully');
      setTimeout(() => setSavedNotice(''), 1000);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDetails() {
    try {
      // Validate phone numbers
      const phoneOk = isValidPhone(phone);
      const contactOk = isValidPhone(contactPhone);
      setPhoneError(phoneOk ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      setContactPhoneError(contactOk ? '' : 'Enter a valid 10-digit phone (digits, +, spaces, () and - allowed).');
      if (!phoneOk || !contactOk) {
        return;
      }
      setSaving(true);
      let logoUrl = logoPreview;
      if (logoFile) {
        setUploadingLogo(true);
        const result = await uploadToCloudinary(logoFile, {
          restaurantCode: restaurant.restaurantCode || '',
          fileType: 'logo',
        });
        logoUrl = result.url;
        setUploadingLogo(false);
      }
      const updates: any = {
        name,
        description,
        phone,
        email,
        instagram: instagram || null,
        facebook: facebook || null,
        youtube: youtube || null,
        website: website || null,
        googleReviews: googleReviews || null,
        contactPhone: contactPhone || null,
        captureCustomerPhone: Boolean(captureCustomerPhone),
      };
      if (logoFile && logoUrl) {
        updates.logo = logoUrl;
      } else if (removeLogo) {
        updates.logo = deleteField();
      }

      await updateDoc(doc(db, 'restaurants', restaurant.id), updates);
      onUpdate();
      setSavedNotice('Details saved');
      setTimeout(() => setSavedNotice(''), 1000);
    } catch (err) {
      console.error('Failed to save details:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be less than 2MB');
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setRemoveLogo(false);
  }

  function applyColorCombination(combination: ReturnType<typeof getTemplateColors>[0]) {
    setPrimaryColor(combination.primary);
    setSecondaryColor(combination.secondary);
    setAccentColor(combination.accent);
    setBackgroundColor(combination.background);
    setThemeMode('custom');
  }

  function applySeasonalTheme(name: 'christmas') {
    if (name === 'christmas') {
      setPrimaryColor('#C62828'); // rich red
      setSecondaryColor('#2E7D32'); // evergreen
      setAccentColor('#FFD54F'); // warm gold
      setBackgroundColor('#0b1020'); // deep night sky
      setThemeMode('custom');
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
        
        {/* Restaurant Details */}
        <div className="space-y-4 pb-8 border-b">
          <h3 className="text-lg font-semibold text-gray-700">Restaurant Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Phone (private)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {phoneError && (<p className="text-xs text-red-600 mt-1">{phoneError}</p>)}
            <p className="text-xs text-gray-500 mt-1">Not shown on menu. Used for admin notifications.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Social Links (compact) */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">Social & Web Links</label>
            <p className="text-xs text-gray-500">Click a platform to reveal its input.</p>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Instagram</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://instagram.com/yourhandle"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Full profile URL (optional)</p>
                  {instagram && (
                    <button
                      type="button"
                      onClick={() => setInstagram('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Instagram link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Public Contact Number</summary>
              <div className="mt-3">
                <input
                  type="tel"
                  placeholder="e.g. +1 555 123 4567"
                  value={contactPhone}
                  onChange={(e) => handleContactPhoneChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {contactPhoneError && (<p className="text-xs text-red-600 mt-1">{contactPhoneError}</p>)}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Shown on the public menu. Tap-to-call on mobile.</p>
                  {contactPhone && (
                    <button
                      type="button"
                      onClick={() => setContactPhone('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear contact number"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Facebook</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Full page URL (optional)</p>
                  {facebook && (
                    <button
                      type="button"
                      onClick={() => setFacebook('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Facebook link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">YouTube</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Channel or video URL (optional)</p>
                  {youtube && (
                    <button
                      type="button"
                      onClick={() => setYoutube('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear YouTube link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Website</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://www.yourrestaurant.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Official website URL (optional)</p>
                  {website && (
                    <button
                      type="button"
                      onClick={() => setWebsite('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear website link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded border p-3">
              <summary className="cursor-pointer select-none font-medium">Google Reviews Page</summary>
              <div className="mt-3">
                <input
                  type="url"
                  placeholder="https://www.google.com/maps/place/..."
                  value={googleReviews}
                  onChange={(e) => setGoogleReviews(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Link to your Google Business reviews page (optional)</p>
                  {googleReviews && (
                    <button
                      type="button"
                      onClick={() => setGoogleReviews('')}
                      className="text-xs px-2 py-1 border rounded text-gray-700 hover:bg-gray-100"
                      title="Clear Google Reviews link"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </details>
            {/* Customer phone capture opt-in – moved below Social links */}
            <div className="flex items-start gap-3 p-3 border rounded">
              <input
                id="captureCustomerPhone"
                type="checkbox"
                className="mt-1"
                checked={captureCustomerPhone}
                onChange={(e) => setCaptureCustomerPhone(e.target.checked)}
              />
              <label htmlFor="captureCustomerPhone" className="text-sm text-gray-700">
                Enable phone collection prompt for customers scanning the QR. If enabled, visitors will see a dialog asking to provide their phone number to receive updates. They can skip this.
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Logo (Optional, max 2MB)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full"
              disabled={uploadingLogo || saving}
            />
            {logoPreview && (
              <div className="mt-6 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Logo Preview:</p>
                <div className="flex items-center gap-4">
                  <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-contain rounded border border-gray-300" />
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(''); setRemoveLogo(true); }}
                    disabled={saving || uploadingLogo}
                    className="px-3 py-2 text-red-700 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
                    title="Remove current logo"
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="pt-2 flex flex-col items-center gap-2">
            {savedNotice && (
              <div className="text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1 text-sm animate-fade">
                {savedNotice}
              </div>
            )}
            <button
              onClick={handleSaveDetails}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </div>

        {/* QR Code Section moved to its own tab */}

        {/* Theme Settings */}
        <div className="pt-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">🎨 Theme Customization</h3>
          <p className="text-sm text-gray-600 mb-6">Choose a template style and customize colors. Changes update instantly in the preview below.</p>
          
          {/* Templates Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">📱 Design Templates</label>
            <p className="text-xs text-gray-600 mb-4">Each template has different typography, button styles, and icon designs</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.keys(TEMPLATES) as TemplateType[]).map((templateKey) => (
                <button
                  key={templateKey}
                  onClick={() => setSelectedTemplate(templateKey)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === templateKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-800">
                    {TEMPLATE_NAMES[templateKey]}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {TEMPLATE_DESCRIPTIONS[templateKey]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Approved Custom Themes */}
          {approvedThemes.length > 0 && (
            <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-3">✅ Your Approved Custom Themes</h4>
              <p className="text-xs text-green-800 mb-4">These custom themes were approved by the master admin and are ready to use!</p>
              <div className="space-y-3">
                {approvedThemes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setPrimaryColor(theme.primaryColor);
                      setSecondaryColor(theme.secondaryColor);
                      setAccentColor(theme.accentColor);
                      setBackgroundColor(theme.backgroundColor);
                      setThemeMode('custom');
                    }}
                    className="w-full p-4 rounded-lg border-2 border-green-300 hover:bg-green-100 transition-all text-left"
                  >
                    <div className="flex items-start gap-4">
                      {theme.logoUrl && (
                        <img src={theme.logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded bg-white p-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{theme.themeName}</div>
                        <p className="text-xs text-gray-600 mt-1">{theme.description}</p>
                        <div className="flex gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.primaryColor }}
                            title={`Primary: ${theme.primaryColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.secondaryColor }}
                            title={`Secondary: ${theme.secondaryColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: theme.accentColor }}
                            title={`Accent: ${theme.accentColor}`}
                          />
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: theme.backgroundColor }}
                            title={`Background: ${theme.backgroundColor}`}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Template Color Combinations */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">🎨 Color Combinations for {TEMPLATE_NAMES[selectedTemplate]}</label>
            <p className="text-xs text-gray-600 mb-4">Click any color combination to apply all 4 colors instantly</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templateColors.map((combo) => (
                <button
                  key={combo.name}
                  onClick={() => applyColorCombination(combo)}
                  className="p-4 rounded-lg border-2 border-gray-300 hover:border-blue-400 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{combo.emoji}</span>
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{combo.name}</div>
                      <div className="text-xs text-gray-600">Color combination preset</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.primary }}
                      title={`Primary: ${combo.primary}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.secondary }}
                      title={`Secondary: ${combo.secondary}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded"
                      style={{ backgroundColor: combo.accent }}
                      title={`Accent: ${combo.accent}`}
                    ></div>
                    <div
                      className="flex-1 h-10 rounded border border-gray-300"
                      style={{ backgroundColor: combo.background }}
                      title={`Background: ${combo.background}`}
                    ></div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Seasonal Themes */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">🎄 Seasonal Themes</label>
            <p className="text-xs text-gray-600 mb-4">Apply festive presets for special occasions</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => applySeasonalTheme('christmas')}
                className="p-4 rounded-lg border-2 border-gray-300 hover:border-green-500 transition-all hover:shadow-md text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🎅</span>
                  <div>
                    <div className="font-semibold text-gray-800">Christmas</div>
                    <div className="text-xs text-gray-600">Red • Green • Gold • Night Sky</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#C62828' }} title="Primary: #C62828"></div>
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#2E7D32' }} title="Secondary: #2E7D32"></div>
                  <div className="flex-1 h-10 rounded" style={{ backgroundColor: '#FFD54F' }} title="Accent: #FFD54F"></div>
                  <div className="flex-1 h-10 rounded border border-gray-300" style={{ backgroundColor: '#0b1020' }} title="Background: #0b1020"></div>
                </div>
              </button>
            </div>
          </div>

          {/* Custom Colors */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">Custom Colors</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-16 h-10 rounded cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview - Now shows actual UI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">📱 Live Preview</label>
            <p className="text-xs text-gray-600 mb-3">This shows exactly how your menu will look to customers</p>
            <ThemePreview theme={currentTheme} restaurantName={name || 'Your Restaurant'} logoUrl={logoPreview} />
          </div>
        </div>
      </div>

      {/* Custom Theme Request Section - COMMENTED OUT */}
      {/* 
      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">✨ Custom Theme Request</h3>
        <p className="text-sm text-gray-600 mb-6">
          Have a unique theme in mind? Submit a custom theme request for master admin review. Once approved, you'll see it as a template option above.
        </p>
        <ThemeRequestForm
          restaurantCode={restaurant.restaurantCode || ''}
          restaurantName={restaurant.name}
          onSubmit={async (themeRequest: ThemeRequest) => {
            await addDoc(collection(db, 'theme_requests'), themeRequest);
            alert('Theme request submitted! The master admin will review it shortly.');
          }}
          isLoading={saving}
        />
      </div>
      */}

      {/* Save Button */}
      {savedNotice && (
        <div className="mt-2 text-center text-green-700 bg-green-100 border border-green-200 rounded px-3 py-1 text-sm animate-fade">
          {savedNotice}
        </div>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save Theme Settings'}
      </button>
    </div>
  );
}
