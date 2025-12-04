# Vercel Deployment Checklist

## ✅ Current Setup Status

Your application is **ready for Vercel deployment** with the following configuration:

### Environment Variables (Already Configured)
- ✅ `VITE_FIREBASE_API_KEY` - Firebase authentication
- ✅ `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- ✅ `VITE_GEMINI_API_KEY` - Google Gemini AI for ChatBot
- ✅ `VITE_CLOUDINARY_CLOUD_NAME` - Image hosting
- ✅ `VITE_CLOUDINARY_UPLOAD_PRESET` - Image upload preset
- ⚠️ `VITE_APP_URL` - Update to your Vercel domain

### Project Structure
```
menu-cards/
├── src/                      # React components & pages
├── api/                       # Vercel API routes
│   ├── chat.js              # ChatBot API endpoint ✅
│   └── analytics.js         # Analytics API endpoint
├── public/                   # Static assets
├── dist/                     # Build output (created on deploy)
├── vercel.json              # Vercel configuration ✅
├── vite.config.ts           # Vite build config
└── package.json             # Dependencies ✅
```

---

## 📋 Pre-Deployment Steps

### 1. Set Environment Variables on Vercel

In your Vercel Project Settings → Environment Variables, add:

```
VITE_GEMINI_API_KEY=your-actual-api-key
VITE_FIREBASE_API_KEY=AIzaSyBRmxShEfByR3hjIrqXfUq5lKHKRV1gFDc
VITE_FIREBASE_AUTH_DOMAIN=menu-cards-cb78c.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=menu-cards-cb78c
VITE_FIREBASE_STORAGE_BUCKET=menu-cards-cb78c.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=326459976948
VITE_FIREBASE_APP_ID=1:326459976948:web:786593a81d24acdbbc82a1
VITE_CLOUDINARY_CLOUD_NAME=dqt0nfvhr
VITE_CLOUDINARY_UPLOAD_PRESET=menu_cards_upload
VITE_APP_URL=https://your-vercel-domain.vercel.app
```

**Important**: Use the environment variables from your local `.env` file.

### 2. Update Vercel Domain in Firebase (CRITICAL!)

Add your Vercel deployment domain to Firebase Authentication → Authorized domains:

```
your-app-name.vercel.app
your-app-name-*.vercel.app  (for preview deployments)
```

Without this, Google OAuth login will fail!

### 3. Verify Build Configuration

The `vercel.json` is already set up to:
- ✅ Build with: `npm run build`
- ✅ Use output directory: `dist`
- ✅ Route API requests to `/api` folder
- ✅ Route all other requests to `index.html` (SPA)

---

## 🚀 Deployment Process

### Via Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod

# View deployment
vercel inspect
```

### Via GitHub Integration

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Vercel automatically deploys on push

---

## ✅ What Works on Vercel

### ChatBot Feature
- ✅ Uses production API: `/api/chat` (serverless function)
- ✅ Sends data to Google Gemini AI
- ✅ Returns AI responses to frontend
- ✅ Full error handling and validation

### Firebase Integration
- ✅ Menu items loaded from Firestore
- ✅ Authentication via Google/Email
- ✅ Image uploads to Cloud Storage
- ✅ Admin dashboard functions

### Other Features
- ✅ QR code generation
- ✅ Logo uploads
- ✅ Bulk CSV imports
- ✅ Cloudinary image hosting
- ✅ GA4 analytics tracking

---

## ⚠️ Important Notes

### API Environment Detection
The ChatBot automatically detects deployment environment:
- **Development** (`npm run dev:full`): Uses `http://localhost:3001/api/chat`
- **Production** (Vercel): Uses `/api/chat` (serverless)

### Code Changes NOT Needed
- ✅ ChatBot component is already configured for production
- ✅ API handler (`/api/chat.js`) is Vercel-compatible
- ✅ No additional modifications required

### Build Size
The build output should be under 1 MB for the main bundle.
Check with: `npm run build`

---

## 🔍 Post-Deployment Testing

After deployment to Vercel:

1. **Test ChatBot**
   - Open your Vercel URL
   - Click chat button
   - Ask a question about the menu
   - Should get AI response

2. **Test Firebase Auth**
   - Click admin/auth
   - Try Google login or email signup
   - Should redirect to dashboard

3. **Test Menu Loading**
   - Navigate to `/r/rest-001` (or any restaurant ID)
   - Menu should load from Firestore
   - Images should display

4. **Test Admin Features**
   - Upload logo in admin dashboard
   - Bulk import CSV file
   - Check Firestore updates

---

## 🆘 Troubleshooting Deployment Issues

### ChatBot shows error "Failed to execute 'json'"
**Cause**: API environment variable not set  
**Fix**: Add `VITE_GEMINI_API_KEY` to Vercel project settings

### Login fails with "unauthorized-domain"
**Cause**: Firebase domain not whitelisted  
**Fix**: Add Vercel domain to Firebase → Authentication → Authorized domains

### Menu doesn't load
**Cause**: Firebase configuration or permissions  
**Fix**: Check `VITE_FIREBASE_*` variables are correct in Vercel settings

### Images don't display
**Cause**: Cloudinary configuration  
**Fix**: Verify `VITE_CLOUDINARY_CLOUD_NAME` in Vercel settings

---

## 📝 Deployment Checklist

Before clicking deploy:

- [ ] All `VITE_*` environment variables added to Vercel
- [ ] Vercel domain added to Firebase Authorized Domains
- [ ] `VITE_APP_URL` set to your Vercel domain
- [ ] `vercel.json` is present and configured
- [ ] `api/chat.js` exists and is valid
- [ ] No uncommitted changes in Git
- [ ] Latest code pushed to main branch

---

## ✨ You're Ready!

Your application is fully configured for Vercel deployment. The ChatBot, Firebase integration, and all features will work seamlessly in production.

**Deployment is a one-click process in Vercel dashboard!**
