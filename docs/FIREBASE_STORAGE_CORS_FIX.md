# Fixing Firebase Storage CORS Errors

## Problem

When uploading images from `http://localhost:3000`, you may encounter CORS errors:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access control check
```

This happens because Firebase Storage (which uses Google Cloud Storage) requires CORS configuration to allow uploads from your localhost origin.

## Solution: Configure CORS for Firebase Storage

**⚠️ Quick Fix**: The easiest way is to use a Firebase service account key. See [FIREBASE_SERVICE_ACCOUNT_SETUP.md](./FIREBASE_SERVICE_ACCOUNT_SETUP.md) for step-by-step instructions.

## Quick Start (Using Service Account Key)

1. **Get service account key**:
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `firebase-service-account.json` in project root

2. **Grant Storage Admin role**:
   - Google Cloud Console → IAM & Admin → IAM
   - Find your service account → Add role "Storage Admin"

3. **Run setup script**:
   ```bash
   node setup-cors.js
   ```

---

## Alternative Methods

### Option 1: Using Google Cloud Console (Recommended)

1. **Install Google Cloud SDK** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Or use: `npm install -g @google-cloud/storage` (for Node.js)

2. **Authenticate with Google Cloud**:
   ```bash
   gcloud auth login
   ```

3. **Set your project**:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
   (Use your Firebase / GCP project ID from the console)

4. **Create a CORS configuration file**:
   Create a file named `cors.json` in your project root with this content:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001", "https://your-production-domain.com"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

5. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_HOSTNAME
   ```
   (Replace with your bucket hostname from Firebase → Storage, e.g. `your-project-id.firebasestorage.app`)

### Option 2: Using Firebase Console + gsutil

1. **Find your Storage bucket name**:
   - Go to Firebase Console → Storage
   - The bucket name is shown at the top (e.g. `your-project-id.firebasestorage.app`)

2. **Create `cors.json` file** in your project root:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

3. **Install gsutil** (part of Google Cloud SDK):
   ```bash
   # Windows (using Chocolatey)
   choco install gcloudsdk
   
   # macOS (using Homebrew)
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

4. **Authenticate and apply**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET_HOSTNAME
   ```

### Option 3: Using Google Cloud Console Web UI

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase / GCP project
3. Navigate to **Cloud Storage** → **Buckets**
4. Open your Firebase Storage bucket (name shown in Firebase → Storage)
5. Go to the **Configuration** tab
6. Scroll to **CORS configuration**
7. Click **Edit CORS configuration**
8. Add this JSON:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "http://localhost:3001"],
       "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
9. Click **Save**

### Option 4: Quick Fix Using Node.js Script

This repository already includes **`setup-cors.js`** at the project root. Configure CORS with environment variables (no project IDs hardcoded in the file):

```bash
npm install @google-cloud/storage
```

```powershell
$env:FIREBASE_PROJECT_ID="your-project-id"
$env:FIREBASE_STORAGE_BUCKET="your-project-id.firebasestorage.app"
node setup-cors.js
```

See **`docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md`** for credentials and IAM.

## Verify CORS Configuration

After applying the CORS configuration, verify it's working:

```bash
gsutil cors get gs://YOUR_STORAGE_BUCKET_HOSTNAME
```

You should see your CORS configuration returned.

## For Production

When deploying to production, make sure to add your production domain to the CORS origins:

```json
{
  "origin": [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-production-domain.com",
    "https://www.your-production-domain.com"
  ],
  ...
}
```

## Troubleshooting

### Still getting CORS errors?

1. **Clear browser cache** - CORS settings may be cached
2. **Check bucket name** - Make sure you're using the correct Firebase Storage bucket name
3. **Verify authentication** - Ensure you're authenticated with `gcloud auth login`
4. **Wait a few minutes** - CORS changes can take a few minutes to propagate
5. **Check browser console** - Look for more detailed error messages

### Common Issues

- **"Bucket not found"**: Check your bucket name in Firebase Console → Storage
- **"Permission denied"**: Make sure you have Storage Admin or Owner permissions
- **"Command not found"**: Install Google Cloud SDK and ensure `gsutil` is in your PATH

## Alternative: Use Firebase Storage Rules (Not Recommended)

While you can't fix CORS with Storage Rules alone, make sure your Storage Rules allow uploads:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{userId}/{fileName} {
      allow write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

But you still need to configure CORS separately using one of the methods above.

