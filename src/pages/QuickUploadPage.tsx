import { useState } from 'react';
import { db } from '../firebase.config';
import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

interface UploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  itemsUploaded?: number;
  totalItems?: number;
}


export function QuickUploadPage() {
  const [restaurantId, setRestaurantId] = useState('rest-001');
  const [menuCsv, setMenuCsv] = useState<string>('');
  const [eventsCsv, setEventsCsv] = useState<string>('');
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', message: '' });
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);

  /**
   * Parse CSV string to array of objects
   */
  function parseCSV(csvText: string) {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const obj: any = {};
      for (let k = 0; k < headers.length; k++) {
        obj[headers[k]] = values[k] || '';
      }
      data.push(obj);
    }

    return data;
  }

  /**
   * Parse ingredients string to array
   */
  function parseIngredients(ingredientsStr: string) {
    if (!ingredientsStr) return [];
    return ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Parse images string to array
   */
  function parseImages(imagesStr: string) {
    if (!imagesStr) return [];
    return imagesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  /**
   * Normalize image URL
   */
  function normalizeImageUrl(url: string) {
    if (!url) return undefined;

    const trimmed = url.trim();
    if (!trimmed) return undefined;

    // Google Drive
    const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (driveMatch) {
      const id = driveMatch[1];
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }

    // Direct URL
    if (trimmed.startsWith('http')) {
      return trimmed;
    }

    return undefined;
  }

  /**
   * Transform menu item CSV row
   */
  function transformMenuItem(row: any) {
    const images = parseImages(row.images);
    const image = normalizeImageUrl(row.image) || (images.length > 0 ? images[0] : undefined);
    const normalizedImages = images.map(normalizeImageUrl).filter(Boolean);
    const videoUrl = normalizeImageUrl(row.video);

    const item: any = {
      name: row.name || 'Unnamed Item',
      section: row.section || 'Menu',
      description: row.description || '',
      price: row.price || '',
      ingredients: parseIngredients(row.ingredients),
      is_todays_special: String(row.is_todays_special || '').toLowerCase() === 'true',
      createdAt: new Date().toISOString(),
    };

    // Add currency if provided, default to INR
    if (row.currency) {
      item.currency = row.currency.toUpperCase();
    } else {
      item.currency = 'INR';
    }

    // Only add optional fields if they have values
    if (image) item.image = image;
    if (normalizedImages.length > 0) item.images = normalizedImages;
    if (videoUrl) item.video = videoUrl;
    if (row.spice) item.spice = parseInt(row.spice);
    if (row.sweet) item.sweet = parseInt(row.sweet);

    return item;
  }

  /**
   * Transform event CSV row
   */
  function transformEvent(row: any) {
    const event: any = {
      title: row.title || 'Unnamed Event',
      date: row.date || '',
      time: row.time || '',
      description: row.description || '',
      createdAt: new Date().toISOString(),
    };

    // Only add image if it exists
    const imageUrl = normalizeImageUrl(row.image);
    if (imageUrl) {
      event.image = imageUrl;
    }

    return event;
  }

  /**
   * Delete all existing data for restaurant
   */
  async function deleteRestaurantData() {
    try {
      const restaurantRef = doc(db, 'restaurants', restaurantId);

      // Delete menu items
      const menuSnapshot = await getDocs(collection(restaurantRef, 'menu_items'));
      for (const docSnap of menuSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Delete events
      const eventsSnapshot = await getDocs(collection(restaurantRef, 'events'));
      for (const docSnap of eventsSnapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Delete restaurant document
      await deleteDoc(restaurantRef);

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload menu items
   */
  async function uploadMenuItems() {
    if (!menuCsv.trim()) {
      setProgress({ status: 'error', message: '❌ Please paste menu items CSV' });
      return;
    }

    if (!restaurantId.trim()) {
      setProgress({ status: 'error', message: '❌ Please enter a restaurant ID' });
      return;
    }

    try {
      setProgress({ status: 'uploading', message: '📤 Parsing menu items...', totalItems: 0 });

      const menuItems = parseCSV(menuCsv);
      if (menuItems.length === 0) {
        setProgress({ status: 'error', message: '❌ No valid menu items found in CSV' });
        return;
      }

      setProgress({ status: 'uploading', message: '📤 Uploading menu items...', totalItems: menuItems.length });

      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const menuItemsRef = collection(restaurantRef, 'menu_items');

      let uploadCount = 0;
      for (const item of menuItems) {
        if (!item.id || !item.name) continue;

        const transformed = transformMenuItem(item);
        await setDoc(doc(menuItemsRef, item.id), transformed);
        uploadCount++;

        setProgress({
          status: 'uploading',
          message: `📤 Uploading menu items (${uploadCount}/${menuItems.length})...`,
          itemsUploaded: uploadCount,
          totalItems: menuItems.length,
        });
      }

      setProgress({
        status: 'success',
        message: `✅ Successfully uploaded ${uploadCount} menu items!`,
        itemsUploaded: uploadCount,
      });
    } catch (error) {
      setProgress({
        status: 'error',
        message: `❌ Error uploading menu items: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Upload events
   */
  async function uploadEvents() {
    if (!eventsCsv.trim()) {
      setProgress({ status: 'error', message: '❌ Please paste events CSV' });
      return;
    }

    if (!restaurantId.trim()) {
      setProgress({ status: 'error', message: '❌ Please enter a restaurant ID' });
      return;
    }

    try {
      setProgress({ status: 'uploading', message: '📤 Parsing events...', totalItems: 0 });

      const events = parseCSV(eventsCsv);
      if (events.length === 0) {
        setProgress({ status: 'error', message: '❌ No valid events found in CSV' });
        return;
      }

      setProgress({ status: 'uploading', message: '📤 Uploading events...', totalItems: events.length });

      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const eventsRef = collection(restaurantRef, 'events');

      let uploadCount = 0;
      for (const event of events) {
        if (!event.id || !event.title) continue;

        const transformed = transformEvent(event);
        await setDoc(doc(eventsRef, event.id), transformed);
        uploadCount++;
      }

      setProgress({
        status: 'success',
        message: `✅ Successfully uploaded ${uploadCount} events!`,
        itemsUploaded: uploadCount,
      });
    } catch (error) {
      setProgress({
        status: 'error',
        message: `❌ Error uploading events: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Upload all data
   */
  async function uploadAll() {
    if (!restaurantId.trim()) {
      setProgress({ status: 'error', message: '❌ Please enter a restaurant ID' });
      return;
    }

    try {
      // First, create the restaurant document if it doesn't exist
      setProgress({ status: 'uploading', message: '📝 Creating restaurant...' });
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await setDoc(restaurantRef, {
        name: restaurantId.replace(/-/g, ' ').toUpperCase(),
        description: 'Restaurant menu',
        isActive: true,
        createdAt: new Date().toISOString(),
      }, { merge: true }); // merge: true means it won't overwrite existing data

      // Then upload menu items and events
      await uploadMenuItems();
      await uploadEvents();
    } catch (error) {
      setProgress({
        status: 'error',
        message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  /**
   * Handle delete with confirmation
   */
  async function handleDelete() {
    try {
      setProgress({ status: 'uploading', message: '🗑️ Deleting all data...' });
      await deleteRestaurantData();
      setProgress({ status: 'success', message: '✅ All data deleted successfully!' });
      setShowDeleteWarning(false);
    } catch (error) {
      setProgress({
        status: 'error',
        message: `❌ Error deleting data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">📤 Quick Data Upload</h1>
          <p className="text-gray-600">Temporary uploader for restaurant data to Firebase</p>
        </div>

        {/* Restaurant ID Input */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant ID</label>
          <input
            type="text"
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            placeholder="e.g., rest-001, rest-002"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">This ID will be used in your QR code: /r/rest-001</p>
        </div>

        {/* Menu Items Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🍽️ Menu Items (CSV)</h2>
          <textarea
            value={menuCsv}
            onChange={(e) => setMenuCsv(e.target.value)}
            placeholder="Paste menu_items.csv content here..."
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={uploadMenuItems}
            disabled={progress.status === 'uploading'}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {progress.status === 'uploading' ? '⏳ Uploading...' : '📤 Upload Menu Items'}
          </button>
        </div>

        {/* Events Upload */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">🎉 Events (CSV)</h2>
          <textarea
            value={eventsCsv}
            onChange={(e) => setEventsCsv(e.target.value)}
            placeholder="Paste events.csv content here..."
            className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={uploadEvents}
            disabled={progress.status === 'uploading'}
            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            {progress.status === 'uploading' ? '⏳ Uploading...' : '📤 Upload Events'}
          </button>
        </div>

        {/* Upload All Button */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <button
            onClick={uploadAll}
            disabled={progress.status === 'uploading'}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all font-bold text-lg"
          >
            {progress.status === 'uploading' ? '⏳ Uploading All Data...' : '🚀 Upload Everything'}
          </button>
        </div>

        {/* Progress Message */}
        {progress.message && (
          <div
            className={`rounded-lg p-4 mb-6 ${
              progress.status === 'success'
                ? 'bg-green-100 text-green-800'
                : progress.status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            <p className="font-semibold">{progress.message}</p>
            {progress.itemsUploaded && progress.totalItems && (
              <div className="mt-2 bg-white/50 rounded p-2">
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      progress.status === 'success'
                        ? 'bg-green-600'
                        : progress.status === 'error'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${(progress.itemsUploaded / progress.totalItems) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Section */}
        <div className="bg-red-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Danger Zone</h3>
          <p className="text-red-700 mb-4">Delete all data for this restaurant (cannot be undone)</p>
          <button
            onClick={() => setShowDeleteWarning(true)}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            🗑️ Delete All Data
          </button>

          {showDeleteWarning && (
            <div className="mt-4 p-4 bg-white border-2 border-red-500 rounded-lg">
              <p className="text-red-800 font-bold mb-4">
                Are you sure? This will delete all menu items and events for {restaurantId}. This cannot be undone!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Yes, Delete Everything
                </button>
                <button
                  onClick={() => setShowDeleteWarning(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
