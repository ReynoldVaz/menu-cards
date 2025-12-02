# Firebase Migration & Data Upload Guide

## Overview

You now have **two ways** to upload restaurant data to Firebase:

### 1. **Quick Upload** (Temporary - Fastest) ⚡
**URL**: `/upload`
- Copy-paste CSV content directly in browser
- No setup needed
- Best for: Quick testing, one-off uploads
- **Trade-off**: No authentication, anyone can access

### 2. **Admin Dashboard** (Long-term - Scalable) 🏢
**URL**: `/admin`
- Professional management interface
- Add/edit/delete items
- Bulk upload support (coming soon)
- Best for: Restaurant owners managing their own data
- **Trade-off**: Requires more development for authentication

---

## Step-by-Step: Get Started

### Phase 1: Quick Setup (Use Quick Upload)

1. **Get Firebase Credentials**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Select your `menu-cards` project
   - Click the gear icon → **Project Settings**
   - Copy these values to your `.env`:
     ```
     VITE_FIREBASE_API_KEY=<your_api_key>
     VITE_FIREBASE_AUTH_DOMAIN=<your_project>.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=<your_project_id>
     VITE_FIREBASE_STORAGE_BUCKET=<your_project>.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
     VITE_FIREBASE_APP_ID=<your_app_id>
     VITE_APP_URL=https://menu-cards.vercel.app
     ```

2. **Create Firestore Database**
   - In Firebase Console → **Build** → **Firestore Database**
   - Click **Create Database**
   - Choose **Production mode**, Region: `us-central1`
   - Click **Create**

3. **Set Security Rules**
   - Go to **Firestore** → **Rules** tab
   - Paste this (allows public read, authenticated write):
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /restaurants/{restaurantId} {
           allow read: if true;
           match /menu_items/{itemId} {
             allow read: if true;
           }
           match /events/{eventId} {
             allow read: if true;
           }
         }
       }
     }
     ```
   - Click **Publish**

4. **Upload Your Data**
   - Start dev server: `npm run dev`
   - Go to `http://localhost:5173/upload`
   - Enter Restaurant ID: `rest-001`
   - Copy entire `Copy of Menu items v1 - menu_items.csv` → Paste in textarea
   - Copy entire `Copy of Menu items v1 - events.csv` → Paste in textarea
   - Click **Upload Everything**
   - ✅ Done! Your data is now in Firebase

5. **Test the Menu**
   - Go to `http://localhost:5173/r/rest-001`
   - You should see your restaurant menu!

---

### Phase 2: Preparing Admin Dashboard (For Later)

The admin dashboard is ready at `/admin` but needs:

**To enable for restaurant owners, you'll need to add:**

1. **Authentication** (Firebase Auth)
   ```typescript
   // src/hooks/useAuth.ts
   import { auth } from '../firebase.config';
   import { signInWithEmail, signOut, onAuthStateChanged } from 'firebase/auth';
   ```

2. **Authorization** (Check if user owns restaurant)
   ```typescript
   // Verify user's email matches restaurant owner email
   // Store owner email in restaurant doc
   ```

3. **Firestore Rules Update**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Public read for menu
       match /restaurants/{restaurantId} {
         allow read: if true;
         match /menu_items/{itemId} {
           allow read: if true;
         }
         match /events/{eventId} {
           allow read: if true;
         }
       }
       
       // Authenticated owners can write
       match /restaurants/{restaurantId} {
         allow write: if request.auth.uid != null && 
                        resource.data.ownerUid == request.auth.uid;
         match /menu_items/{itemId} {
           allow write: if request.auth.uid != null && 
                           get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.ownerUid == request.auth.uid;
         }
       }
     }
   }
   ```

---

## CSV Format Reference

### menu_items.csv
```csv
id,section,name,description,price,ingredients,image,images,is_todays_special,video,spice,sweet
1,Vegetarian Starters,Samosa Trio,Crispy pastries with potato & peas,₹150,"Potatoes, Peas, Flour, Spices, Oil",<image_url>,,FALSE,<video_url>,3,
```

**Required columns:**
- `id` - Unique identifier
- `section` - Menu category
- `name` - Item name
- `description` - Item description
- `price` - Price (can include ₹ symbol)

**Optional columns:**
- `ingredients` - Comma-separated
- `image` - Single image URL
- `images` - Multiple URLs separated by comma
- `is_todays_special` - TRUE or FALSE
- `video` - Video URL
- `spice` - 1-5 rating
- `sweet` - 1-5 rating

### events.csv
```csv
id,title,date,time,description,image
event-1,One Man Show Performance,Saturday,8:00 PM - 9:30 PM,Join us for an evening of comedy,<image_url>
```

**Required columns:**
- `id` - Unique identifier
- `title` - Event name
- `date` - Date or day
- `time` - Time range
- `description` - Event description

**Optional columns:**
- `image` - Event image URL

---

## Firebase Database Structure

```
firestore/
└── restaurants/
    ├── rest-001/
    │   ├── name: "Restaurant 1"
    │   ├── description: "..."
    │   ├── phone: "+919233456789"
    │   ├── isActive: true
    │   ├── ownerEmail: "owner@restaurant.com" (for future auth)
    │   ├── ownerUid: "firebase_user_id" (for future auth)
    │   ├── menu_items/ (subcollection)
    │   │   ├── 1/
    │   │   │   ├── name: "Samosa Trio"
    │   │   │   ├── section: "Vegetarian Starters"
    │   │   │   ├── price: "₹150"
    │   │   │   └── ...
    │   │   └── 2/
    │   └── events/ (subcollection)
    │       ├── event-1/
    │       │   ├── title: "Comedy Night"
    │       │   ├── date: "Saturday"
    │       │   └── ...
    │       └── event-2/
    └── rest-002/
        └── ...
```

---

## Roadmap: Building Full Admin Portal

### Phase 1 (Done) ✅
- [x] Quick upload page
- [x] Admin dashboard skeleton
- [x] Firebase integration

### Phase 2 (Next)
- [ ] Firebase Authentication (email/password)
- [ ] Owner authorization
- [ ] Edit menu items with image upload
- [ ] Add/delete events
- [ ] QR code generation & download

### Phase 3 (Future)
- [ ] Menu item analytics (view counts)
- [ ] Restaurant analytics (scans per day)
- [ ] Bulk CSV import
- [ ] Image upload to Firebase Storage
- [ ] Restaurant owner invitations

---

## Troubleshooting

**Issue**: "Permission denied" when uploading
- **Solution**: Check Firestore rules are set correctly. Make sure public read/write is enabled for testing.

**Issue**: CSV not parsing correctly
- **Solution**: Ensure no line breaks inside quoted fields. Test with your CSV files in the exact format provided.

**Issue**: Images not loading
- **Solution**: 
  - Cloudinary URLs should be public and accessible
  - Google Drive links must be in format `/d/FILE_ID`
  - Test by opening URL directly in browser

**Issue**: Restaurant not appearing in admin list
- **Solution**: Data must be uploaded first via Quick Upload page. Admin dashboard reads from Firestore.

---

## Next Steps

1. ✅ Set up Firebase (Firestore + rules)
2. ✅ Fill in `.env` with Firebase credentials
3. **👉 Use Quick Upload page to get data into Firebase**
4. Test menu at `/r/rest-001`
5. When ready: Add authentication to admin dashboard
6. Make it live with restaurant owner accounts

---

## Support

For issues or questions:
1. Check Firebase Console for data
2. Verify `.env` variables are correct
3. Check browser console for error messages
4. Test CSV format with sample data

