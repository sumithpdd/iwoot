# Firebase Setup Guide

Complete guide for configuring Firebase services for IWOOT.

## Overview

IWOOT uses three Firebase services:
1. **Authentication** - User login/registration
2. **Firestore** - Database for products and receipts
3. **Storage** - Image uploads for products and receipts

## Quick Setup Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database created
- [ ] Storage enabled
- [ ] `.env.local` file created with all values
- [ ] Firestore security rules published
- [ ] Storage security rules published
- [ ] Development server restarted

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name → Continue
4. (Optional) Disable Google Analytics → Create project
5. Wait for creation → Continue

## Step 2: Enable Authentication

1. Click **Authentication** → **Get started**
2. Click **Email/Password** tab
3. Toggle **Enable** → **Save**

## Step 3: Create Firestore Database

1. Click **Firestore Database** → **Create database**
2. Select **Start in test mode**
3. Choose location → **Enable**

**Note**: We'll set proper security rules in Step 5.

## Step 4: Enable Storage

1. Click **Storage** → **Get started**
2. Select **Start in test mode**
3. Choose location → **Done**

## Step 5: Get Configuration Values

1. Click ⚙️ **Project settings**
2. Scroll to **"Your apps"** section
3. Click **Web icon** (`</>`)
4. Register app (name: `iwoot-web`)
5. Copy the `firebaseConfig` values

## Step 6: Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:**
- All variables must start with `NEXT_PUBLIC_`
- No spaces around `=`
- No quotes around values
- Restart dev server after creating/updating

## Step 7: Firestore Security Rules

Go to **Firestore Database** → **Rules** tab:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /products/{productId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /receipts/{receiptId} {
      allow read: if isOwner(resource.data.userId);
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId) && request.resource.data.userId == request.auth.uid;
      allow delete: if isOwner(resource.data.userId);
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
  }
}
```

Click **Publish**.

## Step 8: Storage Security Rules

Go to **Storage** → **Rules** tab:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isAuthenticated() {
      return request.auth != null;
    }
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    match /products/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
    match /receipts/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
  }
}
```

Click **Publish**.

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- ✅ Check `.env.local` exists in project root
- ✅ Verify all variables start with `NEXT_PUBLIC_`
- ✅ Restart dev server
- ✅ Check for typos in variable names

### "Missing or insufficient permissions"
- ✅ Set Firestore security rules (Step 7)
- ✅ Verify rules were published
- ✅ Wait a few seconds for propagation
- ✅ Check you're logged in

### "Permission denied" when uploading
- ✅ Set Storage security rules (Step 8)
- ✅ Check file size (max 5MB)
- ✅ Verify file is an image
- ✅ Check you're logged in

### Images not displaying
- ✅ Check browser console for errors
- ✅ Verify Storage rules allow read access
- ✅ Check image URLs are valid

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use different projects** for dev/production
3. **Rotate keys** if accidentally exposed
4. **Test rules** using Rules Playground in Firebase Console
5. **Monitor usage** in Firebase Console

## Next Steps

After Firebase setup:
1. Restart development server
2. Test authentication (sign up/login)
3. Create a product
4. Upload an image
5. Verify everything works

---

**For detailed setup instructions, see `docs/SETUP_INSTRUCTIONS.md`**
