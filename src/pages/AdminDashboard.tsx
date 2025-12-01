import { useState, useEffect } from 'react';
import { db } from '../firebase.config';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import type { MenuItem, Event } from '../data/menuData';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';

interface AdminDashboardTab {
  id: 'restaurants' | 'menu' | 'events' | 'settings';
  label: string;
  icon: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminDashboardTab['id']>('restaurants');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const tabs: AdminDashboardTab[] = [
    { id: 'restaurants', label: 'Restaurants', icon: '🏪' },
    { id: 'menu', label: 'Menu Items', icon: '🍽️' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Load restaurants
  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'restaurants'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Restaurant[];
      setRestaurants(data);
      if (data.length > 0 && !selectedRestaurant) {
        setSelectedRestaurant(data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurants');
    } finally {
      setLoading(false);
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
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

              {/* Restaurants List */}
              <div className="p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Restaurants</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {restaurants.length === 0 ? (
                    <p className="text-xs text-gray-500">No restaurants</p>
                  ) : (
                    restaurants.map((rest) => (
                      <button
                        key={rest.id}
                        onClick={() => setSelectedRestaurant(rest)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          selectedRestaurant?.id === rest.id
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="truncate font-medium">{rest.name}</div>
                        <div className="text-xs text-gray-500">{rest.id}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
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
            ) : selectedRestaurant ? (
              <>
                {/* Restaurants Tab */}
                {activeTab === 'restaurants' && <RestaurantsTab restaurant={selectedRestaurant} onUpdate={loadRestaurants} />}

                {/* Menu Tab */}
                {activeTab === 'menu' && <MenuTab restaurantId={selectedRestaurant.id} />}

                {/* Events Tab */}
                {activeTab === 'events' && <EventsTab restaurantId={selectedRestaurant.id} />}

                {/* Settings Tab */}
                {activeTab === 'settings' && <SettingsTab restaurant={selectedRestaurant} onUpdate={loadRestaurants} />}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Select a restaurant to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Restaurants Tab
 */
function RestaurantsTab({ restaurant, onUpdate }: { restaurant: Restaurant; onUpdate: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Restaurant Details</h2>
      <div className="grid grid-cols-2 gap-6">
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.phone || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="px-3 py-2 border border-gray-300 rounded bg-gray-50">{restaurant.email || 'N/A'}</p>
        </div>

        <div className="col-span-2">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">📱 QR Code Link</h3>
            <p className="text-blue-800 break-all font-mono">
              https://menu-cards.vercel.app/r/{restaurant.id}
            </p>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              📥 Generate QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Menu Tab
 */
function MenuTab({ restaurantId }: { restaurantId: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, [restaurantId]);

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Menu Items ({items.length})</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ➕ Add Item
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No menu items yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Section</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Special</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.section}</td>
                  <td className="px-4 py-3">{item.price}</td>
                  <td className="px-4 py-3">{item.is_todays_special ? '⭐' : '-'}</td>
                  <td className="px-4 py-3">
                    <button className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
                    <button className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
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
 * Events Tab
 */
function EventsTab({ restaurantId }: { restaurantId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Events ({events.length})</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ➕ Add Event
        </button>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-600">No events yet</p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                  <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:underline text-xs">Edit</button>
                  <button className="text-red-600 hover:underline text-xs">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        name,
        description,
        phone,
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
      <div className="space-y-4">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
