import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import type { MenuItem } from '../../data/menuData';
import { MenuItemForm, type MenuItemFormData } from '../../components/MenuItemForm';
import { BulkUploadMenu } from '../../components/BulkUploadMenu';
import { formatPrice } from '../../utils/formatPrice';

interface MenuTabProps {
  restaurantId: string;
}

export function MenuTab({ restaurantId }: MenuTabProps) {
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
      const updatedItems: MenuItem[] = [];

      for (const formData of bulkItems) {
        const menuItemData: any = {
          ...formData,
          price: String(formData.price),
          is_new: Boolean((formData as any).is_new),
          // createdAt only when creating new
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

        // Upsert logic by name: update existing record if name matches, else add new
        const itemsRef = collection(db, `restaurants/${restaurantId}/menu_items`);
        const existingSnap = await getDocs(query(itemsRef, where('name', '==', formData.name.trim())));

        if (!existingSnap.empty) {
          const existingDoc = existingSnap.docs[0];
          // Preserve createdAt from existing, update other fields
          const existingData = existingDoc.data();
          const updatePayload = {
            ...menuItemData,
            createdAt: existingData.createdAt || new Date().toISOString(),
          };
          await updateDoc(doc(db, `restaurants/${restaurantId}/menu_items/${existingDoc.id}`), updatePayload);
          updatedItems.push({ id: existingDoc.id, ...updatePayload } as unknown as MenuItem);
        } else {
          const createPayload = {
            ...menuItemData,
            createdAt: new Date().toISOString(),
          };
          const docRef = await addDoc(itemsRef, createPayload);
          createdItems.push({ id: docRef.id, ...createPayload } as unknown as MenuItem);
        }
      }

      // Add all new items to local state
      // Merge: update existing entries in local state, then append created
      let nextItems = items.slice();
      for (const updated of updatedItems) {
        nextItems = nextItems.map((it) => (it.id === updated.id ? ({ ...it, ...updated } as unknown as MenuItem) : it));
      }
      setItems([...nextItems, ...createdItems]);
      alert(`✅ Imported ${createdItems.length} new, updated ${updatedItems.length} existing items.`);
    } catch (err) {
      console.error('Failed to bulk upload items:', err);
      alert(`❌ Error importing items: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.9)] p-6">
      {!showForm ? (
        <>
          <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
            <h2 className="text-2xl font-bold text-gray-800">Menu Items ({items.length})</h2>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-5 py-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium"
              >
                ⬆️ Bulk Import
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all font-medium"
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
              youtubeLinks: (editingItem as any).youtubeLinks,
              dietType: (editingItem as any).dietType,
              is_todays_special: editingItem.is_todays_special || false,
              is_unavailable: Boolean((editingItem as any).is_unavailable),
              spice_level: (editingItem as any).spice || (editingItem as any).spice_level,
              sweet_level: (editingItem as any).sweet || (editingItem as any).sweet_level,
              portions: (editingItem as any).portions || [],
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
