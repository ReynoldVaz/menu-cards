# Firebase Credentials Setup Guide

## Step 1: Get Web App Config (For Frontend .env)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Click the **"Your apps"** section or **"Apps"** tab
3. Click **"</>  Web"** (add a web app if you don't have one)
4. Copy the **firebaseConfig** object that looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "menu-cards-cb78c.firebaseapp.com",
  projectId: "menu-cards-cb78c",
  storageBucket: "menu-cards-cb78c.appspot.com",
  messagingSenderId: "326459976948",
  appId: "1:326459976948:web:abcd1234..."
};
```

### Map these to your `.env`:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=menu-cards-cb78c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=menu-cards-cb78c
VITE_FIREBASE_STORAGE_BUCKET=menu-cards-cb78c.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=326459976948
VITE_FIREBASE_APP_ID=1:326459976948:web:abcd1234...
VITE_APP_URL=https://menu-cards.vercel.app
```

---

## Step 2: Create Firestore Database

1. In Firebase Console left sidebar → **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose:
   - **Start in production mode**
   - **Region**: `us-central1` (closest to you, or use `asia-south1` for India)
4. Click **Create**
5. Wait for database to initialize (2-3 minutes)

---

## Step 3: Set Firestore Security Rules

1. Still in Firestore, click **Rules** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to all restaurant data
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

3. Click **Publish**

---

## Step 4: Test the Connection

Once you have the `.env` set up:

1. Start dev server: `npm run dev`
2. Go to `http://localhost:5173/upload`
3. Enter Restaurant ID: `rest-001`
4. If no errors → Firebase is connected! ✅

---

## Step 5: Get Service Account Key (Optional - For Admin SDK)

If you want to use the Node.js uploader script later:

1. Go to **Project Settings** → **Service Accounts** tab
2. Click **Generate New Private Key**
3. A JSON file downloads → Save as `credentials.json` in project root
4. ⚠️ **NEVER commit this file to git!** (Add to `.gitignore`)

---

## Your Project Details (From What You Shared):

```
Project ID: menu-cards-cb78c
Project Number: 326459976948
```

So your values will be:
```
VITE_FIREBASE_AUTH_DOMAIN=menu-cards-cb78c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=menu-cards-cb78c
VITE_FIREBASE_STORAGE_BUCKET=menu-cards-cb78c.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=326459976948
```

You just need the **API Key** and **App ID** from the web app config!

---

## Quick Summary

| What | Where to Find | `.env` Variable |
|-----|---|---|
| API Key | Web App Config | `VITE_FIREBASE_API_KEY` |
| Auth Domain | Web App Config | `VITE_FIREBASE_AUTH_DOMAIN` |
| Project ID | Project Settings | `VITE_FIREBASE_PROJECT_ID=menu-cards-cb78c` |
| Storage Bucket | Web App Config | `VITE_FIREBASE_STORAGE_BUCKET` |
| Sender ID | Project Settings / Web Config | `VITE_FIREBASE_MESSAGING_SENDER_ID=326459976948` |
| App ID | Web App Config | `VITE_FIREBASE_APP_ID` |

Once you have these, share them and I'll help verify everything is correct!
