import { useState, useEffect } from 'react';
import { db } from '../../firebase.config';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc, query, where, writeBatch } from 'firebase/firestore';
import type { MenuItem } from '../../data/menuData';
import { MenuItemForm, type MenuItemFormData } from '../../components/MenuItemForm';
import { BulkUploadMenu } from '../../components/BulkUploadMenu';
import { SmartMenuImport } from '../../components/SmartMenuImport';
import { formatPrice } from '../../utils/formatPrice';

interface MenuTabProps {
  restaurantId: string;
}

export function MenuTab({ restaurantId }: MenuTabProps) {
  const [items, setItems] = useState<MenuItem[]>([]); // Published items from Firebase
  const [pendingItems, setPendingItems] = useState<MenuItem[]>([]); // Local pending changes
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSectionsState] = useState<string[]>(['Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Soups', 'Breads']);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [publishing, setPublishing] = useState(false);

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
      
      // Add to pending items with temporary ID
      const tempId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setPendingItems([
        ...pendingItems,
        {
          id: tempId,
          ...menuItemData,
          _isPending: true,
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

      // Check if editing a pending item
      const isPendingItem = editingItem.id.startsWith('pending_');
      
      if (isPendingItem) {
        // Update in pending items
        setPendingItems(
          pendingItems.map((item) =>
            item.id === editingItem.id
              ? ({ ...item, ...menuItemData, _isPending: true } as unknown as MenuItem)
              : item
          )
        );
      } else {
        // Update existing published item - add to pending as modified
        const updatedItem = {
          ...editingItem,
          ...menuItemData,
          _isPending: true,
          _isModified: true,
        } as unknown as MenuItem;
        
        // Check if already in pending (being re-edited)
        const existingPendingIndex = pendingItems.findIndex(p => p.id === editingItem.id);
        if (existingPendingIndex >= 0) {
          setPendingItems(
            pendingItems.map((item, idx) =>
              idx === existingPendingIndex ? updatedItem : item
            )
          );
        } else {
          setPendingItems([...pendingItems, updatedItem]);
        }
      }

      setEditingItem(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to update menu item:', err);
    } finally {
      setSavingItem(false);
    }
  }

  // Combine published and pending items for display
  // Remove items from published list that are in pending (to avoid duplicates)
  const pendingIds = new Set(pendingItems.map(p => p.id));
  const nonPendingItems = items.filter(item => !pendingIds.has(item.id));
  
  // Put pending items first, then published items
  const allItems = [...pendingItems, ...nonPendingItems];
  
  // Global search: substring match across key fields
  const filteredItems = allItems.filter((item) => {
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
    if (!itemId) return;

    const isPendingItem = itemId.startsWith('pending_');
    const pendingItem = pendingItems.find(item => item.id === itemId);
    const isAlreadyMarkedDeleted = pendingItem && (pendingItem as any)._isDeleted;
    
    // If already marked for deletion, undo it
    if (isAlreadyMarkedDeleted) {
      setPendingItems(pendingItems.filter((item) => item.id !== itemId));
      return;
    }
    
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    if (isPendingItem) {
      // Just remove from pending items (it was never published)
      setPendingItems(pendingItems.filter((item) => item.id !== itemId));
    } else {
      // Mark published item for deletion
      const itemToDelete = items.find(item => item.id === itemId);
      if (itemToDelete) {
        // Check if item is already in pending (being modified)
        const existingPending = pendingItems.find(p => p.id === itemId);
        if (existingPending) {
          // Update existing pending to mark as deleted
          setPendingItems(
            pendingItems.map(p => 
              p.id === itemId 
                ? { ...p, _isPending: true, _isDeleted: true } as unknown as MenuItem
                : p
            )
          );
        } else {
          // Add to pending as deleted
          setPendingItems([
            ...pendingItems,
            { ...itemToDelete, _isPending: true, _isDeleted: true } as unknown as MenuItem
          ]);
        }
      }
    }
  }

  async function handlePublishToMenu() {
    if (pendingItems.length === 0) return;
    
    if (!confirm(`Publish ${pendingItems.length} changes to Menu?`)) return;

    try {
      setPublishing(true);
      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      // Step 1: Upload all media files first
      console.log('📤 Step 1/2: Uploading media files...');
      const processedItems: Array<{
        item: MenuItem;
        cleanData: any;
        isNew: boolean;
        isDeleted: boolean;
        isModified: boolean;
      }> = [];

      for (const item of pendingItems) {
        const isNewItem = item.id?.startsWith('pending_') || false;
        const isDeleted = (item as any)._isDeleted;
        const isModified = (item as any)._isModified;

        // Upload media files if present
        let uploadedImageUrls: string[] = (item as any).images || [];
        let uploadedVideoUrls: string[] = (item as any).videos || [];
        
        if ((item as any)._imageFiles && (item as any)._imageFiles.length > 0) {
          console.log(`  Uploading ${(item as any)._imageFiles.length} images for ${item.name}...`);
          const { uploadToCloudinary } = await import('../../utils/cloudinaryUpload');
          const newUrls: string[] = [];
          for (const file of (item as any)._imageFiles) {
            const result = await uploadToCloudinary(file, {
              restaurantCode: restaurantId,
              fileType: 'image',
            });
            newUrls.push(result.url);
          }
          uploadedImageUrls = [...uploadedImageUrls, ...newUrls];
        }
        
        if ((item as any)._videoFiles && (item as any)._videoFiles.length > 0) {
          console.log(`  Uploading ${(item as any)._videoFiles.length} videos for ${item.name}...`);
          const { uploadToCloudinary } = await import('../../utils/cloudinaryUpload');
          const newUrls: string[] = [];
          for (const file of (item as any)._videoFiles) {
            const result = await uploadToCloudinary(file, {
              restaurantCode: restaurantId,
              fileType: 'video',
            });
            newUrls.push(result.url);
          }
          uploadedVideoUrls = [...uploadedVideoUrls, ...newUrls];
        }

        // Remove metadata fields before saving
        const cleanItem = { ...item };
        delete (cleanItem as any)._isPending;
        delete (cleanItem as any)._isModified;
        delete (cleanItem as any)._isDeleted;
        delete (cleanItem as any)._imageFiles;
        delete (cleanItem as any)._videoFiles;
        delete (cleanItem as any)._imagePreviews;
        delete (cleanItem as any)._videoPreviews;
        delete (cleanItem as any).id; // Remove temp ID for new items
        
        // Update with uploaded URLs
        if (uploadedImageUrls.length > 0) {
          (cleanItem as any).images = uploadedImageUrls;
          (cleanItem as any).image = uploadedImageUrls[0];
        }
        if (uploadedVideoUrls.length > 0) {
          (cleanItem as any).videos = uploadedVideoUrls;
          (cleanItem as any).video = uploadedVideoUrls[0];
        }

        processedItems.push({
          item,
          cleanData: cleanItem,
          isNew: isNewItem,
          isDeleted,
          isModified,
        });
      }

      // Step 2: Batch write to Firebase (up to 500 operations per batch)
      console.log('💾 Step 2/2: Writing to Firebase in batches...');
      const BATCH_SIZE = 500;
      
      for (let i = 0; i < processedItems.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchItems = processedItems.slice(i, i + BATCH_SIZE);
        
        for (const { item, cleanData, isNew, isDeleted, isModified } of batchItems) {
          if (isDeleted) {
            const docRef = doc(db, `restaurants/${restaurantId}/menu_items/${item.id}`);
            batch.delete(docRef);
            deletedCount++;
          } else if (isNew) {
            const docRef = doc(collection(db, `restaurants/${restaurantId}/menu_items`));
            batch.set(docRef, cleanData);
            createdCount++;
          } else if (isModified) {
            const docRef = doc(db, `restaurants/${restaurantId}/menu_items/${item.id}`);
            batch.update(docRef, cleanData);
            updatedCount++;
          }
        }
        
        await batch.commit();
        console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1} committed (${batchItems.length} operations)`);
      }

      // Clean up blob URLs
      pendingItems.forEach(item => {
        if ((item as any)._imagePreviews) {
          (item as any)._imagePreviews.forEach((url: string) => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          });
        }
        if ((item as any)._videoPreviews) {
          (item as any)._videoPreviews.forEach((url: string) => {
            if (url.startsWith('blob:')) URL.revokeObjectURL(url);
          });
        }
      });

      // Reload items from Firebase
      await loadMenuItems();
      
      // Clear pending items
      setPendingItems([]);
      
      alert(`✅ Published successfully!\n${createdCount} created, ${updatedCount} updated, ${deletedCount} deleted.`);
    } catch (err) {
      console.error('Failed to publish changes:', err);
      alert(`❌ Error publishing changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPublishing(false);
    }
  }

  function handleDiscardChanges() {
    if (pendingItems.length === 0) return;
    
    if (!confirm(`Discard ${pendingItems.length} pending changes?`)) return;
    
    // Clean up blob URLs before discarding
    pendingItems.forEach(item => {
      if ((item as any)._imagePreviews) {
        (item as any)._imagePreviews.forEach((url: string) => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
      }
      if ((item as any)._videoPreviews) {
        (item as any)._videoPreviews.forEach((url: string) => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
      }
    });
    
    setPendingItems([]);
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
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Menu Items ({items.length})
                {pendingItems.length > 0 && (
                  <span className="ml-3 text-lg text-orange-600 font-semibold">
                    {pendingItems.length} Pending
                  </span>
                )}
              </h2>
            </div>
            <div className="flex gap-3 w-full sm:w-auto flex-wrap">
              {pendingItems.length > 0 && (
                <>
                  <button
                    onClick={handlePublishToMenu}
                    disabled={publishing}
                    className="px-5 py-2.5 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium disabled:opacity-50"
                  >
                    {publishing ? '⏳ Publishing...' : `✓ Publish ${pendingItems.length} Changes`}
                  </button>
                  <button
                    onClick={handleDiscardChanges}
                    disabled={publishing}
                    className="px-5 py-2.5 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium disabled:opacity-50"
                  >
                    ✕ Discard All
                  </button>
                </>
              )}
              <button
                onClick={() => setShowSmartImport(true)}
                className="px-5 py-2.5 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium"
              >
                📸 Smart Import
              </button>
              <button
                onClick={() => setShowBulkUpload(true)}
                className="px-5 py-2.5 bg-gradient-to-br from-gray-700 to-gray-800 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.05)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.05)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] transition-all font-medium"
              >
                ⬆️ CSV Import
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.15),-2px_-2px_6px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_4px_rgba(0,0,0,0.15),-1px_-1px_3px_rgba(255,255,255,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2)] transition-all font-medium"
              >
                ➕ Add Item
              </button>
            </div>
          </div>

          {pendingItems.length > 0 && (
            <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">💾</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800">
                    You have {pendingItems.length} pending change{pendingItems.length > 1 ? 's' : ''}
                  </h3>
                  <div className="mt-2 text-sm text-orange-700">
                    <p>
                      Changes are saved locally. Click <strong>"Publish Changes"</strong> to save them to Menu, 
                      or <strong>"Discard All"</strong> to cancel all pending changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items (name, section, ingredients...)"
              className="w-full sm:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {showSmartImport && (
            <SmartMenuImport
              restaurantId={restaurantId}
              onExtractedData={(extractedItems) => {
                handleBulkUpload(extractedItems);
                setShowSmartImport(false);
              }}
              onClose={() => setShowSmartImport(false)}
            />
          )}

          {showBulkUpload && (
            <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">CSV Bulk Import</h3>
                <button onClick={() => setShowBulkUpload(false)} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
              </div>
              <BulkUploadMenu onUpload={handleBulkUpload} isLoading={savingItem} />
            </div>
          )}

          {loading ? (
            <p className="text-gray-600">Loading...</p>
          ) : allItems.length === 0 ? (
            <p className="text-gray-600">No menu items yet. Click "Add Item" to get started!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Section</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Price</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Veg</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700 hidden sm:table-cell">Special</th>
                    <th className="px-3 sm:px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isDeleted = (item as any)._isDeleted;
                    const isModified = (item as any)._isModified;
                    const isNew = item.id?.startsWith('pending_') || false;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className={`border-t hover:bg-gray-50 ${
                          isDeleted ? 'bg-red-50 opacity-60 line-through' : 
                          isNew ? 'bg-green-50' : 
                          isModified ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="px-3 sm:px-4 py-3 text-xs">
                          {isDeleted ? '🗑️ Delete' : 
                           isNew ? '✨ New' : 
                           isModified ? '✏️ Modified' : 
                           '✓ Published'}
                        </td>
                        <td className="px-3 sm:px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{item.section}</td>
                        <td className="px-3 sm:px-4 py-3">{formatPrice(item.price, (item as any).currency)}</td>
                        <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{(item as any).is_vegetarian ? '🌱' : '-'}</td>
                        <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">{item.is_todays_special ? '⭐' : '-'}</td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          {!isDeleted && (
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setShowForm(true);
                              }}
                              className="text-blue-600 hover:underline text-xs mr-2"
                            >
                              Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            {isDeleted ? 'Undo' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
              // Pass pending media data if editing pending item
              _imageFiles: (editingItem as any)._imageFiles,
              _videoFiles: (editingItem as any)._videoFiles,
              _imagePreviews: (editingItem as any)._imagePreviews,
              _videoPreviews: (editingItem as any)._videoPreviews,
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
