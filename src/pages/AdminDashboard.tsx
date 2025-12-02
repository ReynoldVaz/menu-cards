import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase.config';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, deleteDoc } from 'firebase/firestore';
import type { MenuItem, Event } from '../data/menuData';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { MenuItemForm, type MenuItemFormData } from '../components/MenuItemForm';
import { EventForm, type EventFormData } from '../components/EventForm';

interface AdminDashboardTab {
  id: 'restaurants' | 'menu' | 'events' | 'settings';
  label: string;
  icon: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminDashboardTab['id']>('restaurants');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const tabs: AdminDashboardTab[] = [
    { id: 'restaurants', label: 'Restaurant', icon: '🏪' },
    { id: 'menu', label: 'Menu Items', icon: '🍽️' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Load current user's restaurant
  useEffect(() => {
    loadUserRestaurant();
  }, []);

  async function loadUserRestaurant() {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Not authenticated');
        navigate('/admin/auth');
        return;
      }

      // Get user document to find their restaurant code
      const userSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', '==', currentUser.uid)));
      
      if (userSnapshot.empty) {
        setError('User data not found');
        return;
      }

      const userData = userSnapshot.docs[0].data() as { restaurantCode: string };
      const restaurantCode = userData.restaurantCode;

      // Get restaurant document using the code
      const restaurantSnapshot = await getDocs(query(collection(db, 'restaurants'), where('restaurantCode', '==', restaurantCode)));
      
      if (!restaurantSnapshot.empty) {
        const restaurantData = restaurantSnapshot.docs[0].data();
        setRestaurant({
          id: restaurantCode, // Use restaurant code as the ID
          name: restaurantData.name,
          restaurantCode: restaurantData.restaurantCode,
          ownerId: restaurantData.ownerId,
          phone: restaurantData.phone,
          email: restaurantData.email,
          address: restaurantData.address,
          description: restaurantData.description,
          logo: restaurantData.logo,
          theme: restaurantData.theme,
          isActive: restaurantData.isActive,
          createdAt: restaurantData.createdAt,
          updatedAt: restaurantData.updatedAt,
        } as Restaurant);
      } else {
        setError('Restaurant not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load restaurant');
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

/**
 * Restaurants Tab
 */
function RestaurantsTab({ restaurant }: { restaurant: Restaurant }) {
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
  const [showForm, setShowForm] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

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

  async function handleAddItem(formData: MenuItemFormData) {
    try {
      setSavingItem(true);
      // Convert price to string for storage consistency
      const menuItemData = {
        ...formData,
        price: String(formData.price),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
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

  async function handleDeleteItem(itemId: string | undefined) {
    if (!itemId || !confirm('Are you sure you want to delete this item?')) return;

    try {
      await deleteDoc(doc(db, `restaurants/${restaurantId}/menu_items/${itemId}`));
      setItems(items.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error('Failed to delete menu item:', err);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Menu Items ({items.length})</h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
            >
              ➕ Add Item
            </button>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No menu items yet. Click "Add Item" to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Section</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Veg</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Special</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">{item.section}</td>
                      <td className="px-4 py-3">₹{item.price}</td>
                      <td className="px-4 py-3">{(item as any).is_vegetarian ? '🌱' : '-'}</td>
                      <td className="px-4 py-3">{item.is_todays_special ? '⭐' : '-'}</td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:underline text-xs mr-2">Edit</button>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Menu Item</h2>
          <MenuItemForm
            restaurantCode={restaurantId}
            onSubmit={handleAddItem}
            onCancel={() => setShowForm(false)}
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
                      <button className="text-blue-600 hover:underline text-xs">Edit</button>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Event</h2>
          <EventForm
            restaurantCode={restaurantId}
            onSubmit={handleAddEvent}
            onCancel={() => setShowForm(false)}
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
