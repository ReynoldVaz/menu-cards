import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, auth } from '../firebase.config';
import { collection, getDocs, doc, updateDoc, query, where, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import type { MenuItem, Event } from '../data/menuData';
import type { Restaurant } from '../hooks/useFirebaseRestaurant';
import { MenuItemForm, type MenuItemFormData } from '../components/MenuItemForm';
import { EventForm, type EventFormData } from '../components/EventForm';
import { ThemePreview } from '../components/ThemePreview';
import { BulkUploadMenu } from '../components/BulkUploadMenu';
import { TEMPLATES, TEMPLATE_NAMES, TEMPLATE_DESCRIPTIONS, getTemplateColors, type TemplateType } from '../utils/templateStyles';
import { uploadToCloudinary } from '../utils/cloudinaryUpload';
import { formatPrice } from '../utils/formatPrice';

interface AdminDashboardTab {
  id: 'restaurants' | 'menu' | 'events' | 'settings';
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
    { id: 'menu', label: 'Menu Items', icon: '🍽️' },
    { id: 'events', label: 'Events', icon: '🎉' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Load current user's restaurant or query parameter restaurant
  useEffect(() => {
    loadRestaurant();
  }, [searchParams]);

  async function loadRestaurant() {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Not authenticated');
        navigate('/admin/auth');
        return;
      }

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
  const [sections, setSectionsState] = useState<string[]>(['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups', 'Breads']);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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
          <BulkUploadMenu
            onUpload={handleBulkUpload}
            isLoading={savingItem}
          />

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
                      <td className="px-4 py-3">{formatPrice(item.price, (item as any).currency)}</td>
                      <td className="px-4 py-3">{(item as any).is_vegetarian ? '🌱' : '-'}</td>
                      <td className="px-4 py-3">{item.is_todays_special ? '⭐' : '-'}</td>
                      <td className="px-4 py-3">
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
      const eventData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

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
  const [themeMode, setThemeMode] = useState(restaurant.theme?.mode || 'custom');
  const [primaryColor, setPrimaryColor] = useState(restaurant.theme?.primaryColor || '#EA580C');
  const [secondaryColor, setSecondaryColor] = useState(restaurant.theme?.secondaryColor || '#FB923C');
  const [accentColor, setAccentColor] = useState(restaurant.theme?.accentColor || '#FED7AA');
  const [backgroundColor, setBackgroundColor] = useState(restaurant.theme?.backgroundColor || '#FFFFFF');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(
    (restaurant.theme?.template as TemplateType) || 'modern'
  );
  const [saving, setSaving] = useState(false);
  const [approvedThemes, setApprovedThemes] = useState<any[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(restaurant.logo || '');
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

      await updateDoc(doc(db, 'restaurants', restaurant.id), {
        name,
        description,
        phone,
        theme: currentTheme,
        ...(logoUrl && { logo: logoUrl }),
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to save:', err);
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
  }

  function applyColorCombination(combination: ReturnType<typeof getTemplateColors>[0]) {
    setPrimaryColor(combination.primary);
    setSecondaryColor(combination.secondary);
    setAccentColor(combination.accent);
    setBackgroundColor(combination.background);
    setThemeMode('custom');
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
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
                <img src={logoPreview} alt="Logo Preview" className="h-20 w-20 object-contain rounded border border-gray-300" />
              </div>
            )}
          </div>
        </div>

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
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {saving ? 'Saving...' : 'Save All Changes'}
      </button>
    </div>
  );
}
