# Firebase Setup Guide for Menu Cards

## Step 1: Create Firestore Database

1. Go to **Firebase Console**: https://console.firebase.google.com/
2. Select your **menu-cards** project
3. In the left sidebar, go to **Build > Firestore Database**
4. Click **Create Database**
5. Choose:
   - **Start in production mode**
   - **Region**: `us-central1` (or nearest to you)
6. Click **Create**

## Step 2: Set Up Firestore Security Rules

Once Firestore is created, go to **Rules** tab and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to restaurants and their subcollections (public menu)
    match /restaurants/{restaurantId} {
      allow read: if true;
      match /menu_items/{itemId} {
        allow read: if true;
      }
      match /events/{eventId} {
        allow read: if true;
      }
    }
    
    // Optional: Allow authenticated admin writes (implement later if needed)
    match /{document=**} {
      allow read: if true;
    }
  }
}
```

Click **Publish** to save.

## Step 3: Get Firebase Credentials

1. Go to **Project Settings** (gear icon)
2. Click **Service Accounts** tab
3. Click **Generate New Private Key**
4. Save the JSON file (you'll need this for the uploader)
5. Also copy these values to your `.env` file:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

## Step 4: Database Structure

Your Firestore will look like this:

```
restaurants/
├── rest-001/
│   ├── name: "Restaurant Name"
│   ├── description: "..."
│   ├── phone: "+919233456789"
│   ├── isActive: true
│   ├── menu_items/ (subcollection)
│   │   ├── item-1/
│   │   │   ├── name: "Samosa Trio"
│   │   │   ├── section: "Vegetarian Starters"
│   │   │   ├── price: "₹150"
│   │   │   └── ...
│   │   └── item-2/
│   └── events/ (subcollection)
│       ├── event-1/
│       │   ├── title: "Comedy Night"
│       │   ├── date: "2025-12-06"
│       │   └── ...
│       └── event-2/
└── rest-002/
    └── ...
```

## Step 5: Upload Data

Use the **Admin Dashboard** to bulk import menu items:

1. Navigate to Admin Dashboard → Menu Items tab
2. Click "Bulk Upload CSV" button
3. Download the template CSV file
4. Fill in your menu items (name, section, price required; others optional)
5. Upload the CSV file
6. Review the preview and confirm import

This will:
1. Parse your CSV file
2. Validate data
3. Transform data for Firebase
4. Upload to Firestore automatically

---

## CSV File Format Expected

### menu_items.csv Columns:
- `id` - Unique item ID
- `section` - Menu section (Vegetarian Starters, Chinese Rice, etc.)
- `name` - Item name
- `description` - Item description
- `price` - Price (e.g., ₹150)
- `ingredients` - Comma-separated list
- `image` - Single image URL (Cloudinary/Google Drive)
- `images` - Multiple URLs comma-separated
- `is_todays_special` - TRUE/FALSE
- `video` - Video URL
- `spice` - Spice level (1-5)
- `sweet` - Sweetness level (1-5)

### events.csv Columns:
- `id` - Unique event ID
- `title` - Event title
- `date` - Date (e.g., Saturday, 2025-12-06)
- `time` - Time (e.g., 8:00 PM - 9:30 PM)
- `description` - Event description
- `image` - Event image URL

---

## Troubleshooting

**Issue**: "Permission denied" error
- Solution: Check your Firestore rules and make sure you're authenticated

**Issue**: Data not appearing
- Solution: Check if documents were created in Firestore Console

**Issue**: Images not loading
- Solution: Ensure Cloudinary/Drive links are publicly accessible

