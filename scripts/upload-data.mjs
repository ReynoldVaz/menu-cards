#!/usr/bin/env node

/**
 * Firebase Data Uploader
 * 
 * This script reads menu_items.csv and events.csv from the templates/google-sheets folder
 * and uploads them to Firebase Firestore.
 * 
 * Usage:
 *   node scripts/upload-data.mjs
 * 
 * Make sure to:
 * 1. Set FIREBASE_CREDENTIALS_PATH environment variable or place credentials.json in project root
 * 2. Have your CSV files in templates/google-sheets/
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CSV_DIR = path.join(PROJECT_ROOT, 'templates/google-sheets');
const CREDENTIALS_PATH = process.env.FIREBASE_CREDENTIALS_PATH || 
  path.join(PROJECT_ROOT, 'credentials.json');

const MENU_ITEMS_CSV = path.join(CSV_DIR, 'menu_items.csv');
const EVENTS_CSV = path.join(CSV_DIR, 'events.csv');

// Restaurant ID (change this for different restaurants)
const RESTAURANT_ID = process.argv[2] || 'rest-001';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j++; // Skip next quote
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

    // Create object from headers and values
    const obj = {};
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
function parseIngredients(ingredientsStr) {
  if (!ingredientsStr) return [];
  return ingredientsStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Parse images string to array
 */
function parseImages(imagesStr) {
  if (!imagesStr) return [];
  return imagesStr
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Normalize image URL (handle Google Drive and Cloudinary)
 */
function normalizeImageUrl(url) {
  if (!url) return undefined;

  const trimmed = url.trim();
  if (!trimmed) return undefined;

  // Google Drive file link - extract ID and convert to download link
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (driveMatch) {
    const id = driveMatch[1];
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }

  // Return as-is if it's a URL
  if (trimmed.startsWith('http')) {
    return trimmed;
  }

  return undefined;
}

/**
 * Transform menu item CSV row to Firestore document
 */
function transformMenuItem(row) {
  const images = parseImages(row.images);
  const image = normalizeImageUrl(row.image) || (images.length > 0 ? images[0] : undefined);

  return {
    name: row.name || 'Unnamed Item',
    section: row.section || 'Menu',
    description: row.description || '',
    price: row.price || '',
    ingredients: parseIngredients(row.ingredients),
    image: image,
    images: images.map(normalizeImageUrl).filter(Boolean),
    is_todays_special: String(row.is_todays_special || '').toLowerCase() === 'true',
    video: normalizeImageUrl(row.video),
    spice: row.spice ? parseInt(row.spice) : null,
    sweet: row.sweet ? parseInt(row.sweet) : null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transform event CSV row to Firestore document
 */
function transformEvent(row) {
  return {
    title: row.title || 'Unnamed Event',
    date: row.date || '',
    time: row.time || '',
    description: row.description || '',
    image: normalizeImageUrl(row.image),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Main upload function
 */
async function uploadData() {
  try {
    log('\n=== Firebase Data Uploader ===\n', 'blue');
    log(`Restaurant ID: ${RESTAURANT_ID}`, 'blue');

    // Check if credentials file exists
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      log(`\n❌ Error: Firebase credentials file not found at ${CREDENTIALS_PATH}`, 'red');
      log('\nTo fix:', 'yellow');
      log('1. Go to Firebase Console > Project Settings > Service Accounts');
      log('2. Click "Generate New Private Key"');
      log('3. Save it as credentials.json in project root', 'yellow');
      process.exit(1);
    }

    // Initialize Firebase Admin
    log('\n📝 Initializing Firebase Admin...', 'blue');
    const serviceAccount = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    const db = getFirestore(app);

    // Read and parse CSV files
    log('📖 Reading CSV files...', 'blue');
    if (!fs.existsSync(MENU_ITEMS_CSV)) {
      log(`\n❌ Error: menu_items.csv not found at ${MENU_ITEMS_CSV}`, 'red');
      process.exit(1);
    }
    if (!fs.existsSync(EVENTS_CSV)) {
      log(`❌ Error: events.csv not found at ${EVENTS_CSV}`, 'red');
      process.exit(1);
    }

    const menuItemsText = fs.readFileSync(MENU_ITEMS_CSV, 'utf8');
    const eventsText = fs.readFileSync(EVENTS_CSV, 'utf8');

    const menuItems = parseCSV(menuItemsText);
    const events = parseCSV(eventsText);

    log(`✅ Found ${menuItems.length} menu items`, 'green');
    log(`✅ Found ${events.length} events`, 'green');

    // Prepare restaurant data
    const restaurantRef = db.collection('restaurants').doc(RESTAURANT_ID);
    const restaurantData = {
      name: `Restaurant ${RESTAURANT_ID}`,
      description: 'Multi-cuisine restaurant with diverse menu',
      phone: '+919233456789',
      email: 'info@restaurant.com',
      address: 'City Center, India',
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    // Upload menu items
    log('\n📤 Uploading menu items...', 'blue');
    const menuItemsRef = restaurantRef.collection('menu_items');
    let itemCount = 0;

    for (const item of menuItems) {
      if (!item.id || !item.name) {
        log(`⚠️  Skipping item without id or name:`, 'yellow', item);
        continue;
      }

      const transformed = transformMenuItem(item);
      await menuItemsRef.doc(item.id).set(transformed);
      itemCount++;

      if (itemCount % 10 === 0) {
        log(`  Uploaded ${itemCount}/${menuItems.length} items...`);
      }
    }

    log(`✅ Uploaded ${itemCount} menu items`, 'green');

    // Upload events
    log('\n📤 Uploading events...', 'blue');
    const eventsRef = restaurantRef.collection('events');
    let eventCount = 0;

    for (const event of events) {
      if (!event.id || !event.title) {
        log(`⚠️  Skipping event without id or title`, 'yellow');
        continue;
      }

      const transformed = transformEvent(event);
      await eventsRef.doc(event.id).set(transformed);
      eventCount++;
    }

    log(`✅ Uploaded ${eventCount} events`, 'green');

    // Update restaurant document
    log('\n📤 Creating restaurant document...', 'blue');
    await restaurantRef.set(restaurantData);
    log(`✅ Created restaurant: ${RESTAURANT_ID}`, 'green');

    log('\n=== Upload Complete! ===\n', 'green');
    log(`View your data at: https://console.firebase.google.com/project/${serviceAccount.project_id}/firestore`, 'blue');
    log(`QR Code links to: https://menu-cards.vercel.app/r/${RESTAURANT_ID}\n`, 'blue');

    process.exit(0);
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the uploader
uploadData();
