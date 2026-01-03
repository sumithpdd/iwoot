# Complete Setup Instructions

Step-by-step guide to get IWOOT running on your local machine.

## Prerequisites

- [ ] Node.js 18+ installed
- [ ] npm or yarn
- [ ] Code editor (VS Code recommended)
- [ ] Firebase account (free tier works)
- [ ] Git (if cloning from repository)

## Step 1: Install Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version
3. Run the installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Step 2: Get the Project

### Option A: Clone from Git
```bash
git clone [repository-url]
cd iwoot
```

### Option B: Download/Extract
- Extract project files to a folder
- Open terminal in that folder

## Step 3: Install Dependencies

```bash
npm install
```

This installs all required packages. Wait for completion (may take a few minutes).

## Step 4: Create Firebase Project

### 4.1 Create Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `iwoot` (or your preferred name)
4. Click **Continue**
5. **Disable** Google Analytics (optional) → Click **Create project**
6. Wait for project creation → Click **Continue**

### 4.2 Enable Authentication

1. In Firebase Console, click **Authentication** in left sidebar
2. Click **Get started**
3. Click **Email/Password** tab
4. Toggle **Enable** → Click **Save**

### 4.3 Create Firestore Database

1. Click **Firestore Database** in left sidebar
2. Click **Create database**
3. Select **Start in test mode** (we'll set proper rules later)
4. Choose a location (closest to you)
5. Click **Enable**

### 4.4 Enable Storage (for Image Uploads)

1. Click **Storage** in left sidebar
2. Click **Get started**
3. Select **Start in test mode**
4. Choose location (same as Firestore if possible)
5. Click **Done**

## Step 5: Get Firebase Configuration

1. In Firebase Console, click the **gear icon** (⚙️) next to "Project Overview"
2. Select **Project settings**
3. Scroll to **"Your apps"** section
4. Click the **Web icon** (`</>`) to add a web app
5. Register the app:
   - App nickname: `iwoot-web` (or any name)
   - **Don't check** "Also set up Firebase Hosting"
   - Click **Register app**
6. You'll see a `firebaseConfig` object with your credentials
7. **Copy these values** (you'll need them in the next step):
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

## Step 6: Create Environment Variables

1. In your project root folder, create a file named `.env.local`
2. Add the following content (replace with YOUR values):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Example:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

**Important:**
- No spaces around the `=` sign
- No quotes around values (unless part of the value itself)
- All variables must start with `NEXT_PUBLIC_`

## Step 7: Set Firestore Security Rules

**⚠️ CRITICAL**: Without these rules, you'll get "permission denied" errors!

1. In Firebase Console, click **Firestore Database** → **Rules** tab
2. Delete existing rules
3. Paste these rules:

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

4. Click **Publish**
5. Wait for "Rules published successfully" message

## Step 8: Set Storage Security Rules

1. In Firebase Console, click **Storage** → **Rules** tab
2. Replace with:

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

3. Click **Publish**

## Step 9: Start Development Server

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

## Step 10: Open the Application

1. Open your browser
2. Go to [http://localhost:3000](http://localhost:3000)
3. You should see the login page
4. Click **Sign up** to create an account
5. After signing up, you'll be redirected to the dashboard

## Verification Checklist

- [ ] Development server starts without errors
- [ ] Can access http://localhost:3000
- [ ] Can create an account
- [ ] Can log in
- [ ] Can see the dashboard
- [ ] Can create a product
- [ ] Can upload images (if Storage is set up)

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- ✅ Verify `.env.local` exists in project root
- ✅ Check all variables start with `NEXT_PUBLIC_`
- ✅ Restart dev server after creating `.env.local`
- ✅ Ensure no spaces around `=` in `.env.local`

### "Missing or insufficient permissions"
- ✅ Set Firestore security rules (Step 7)
- ✅ Verify rules were published
- ✅ Wait a few seconds for rules to propagate
- ✅ Check you're logged in

### "Permission denied" when uploading images
- ✅ Set Storage security rules (Step 8)
- ✅ Verify you're logged in
- ✅ Check file size is under 5MB
- ✅ Verify file is an image type

### Module not found errors
```bash
npm install
```

### Port already in use
```bash
# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

## Next Steps

After setup is complete:
1. Explore the dashboard
2. Create some products
3. Try uploading images
4. Create receipts
5. Read the [Developer Guide](DEVELOPER_GUIDE.md) to understand the codebase

## Additional Resources

- **Architecture**: See `docs/ARCHITECTURE.md`
- **Concepts**: See `docs/CONCEPTS.md`
- **Security**: See `docs/SECURITY.md`
- **Quick Reference**: See `docs/QUICK_REFERENCE.md`

---

**Setup complete! Happy coding! 🚀**
