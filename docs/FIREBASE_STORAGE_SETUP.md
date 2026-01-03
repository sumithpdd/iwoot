# Firebase Storage Setup

## Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **Get started**
5. Choose **Start in test mode** (for development)
6. Select a location (same as Firestore if possible)
7. Click **Done**

## Security Rules

Update Storage security rules to allow authenticated users to upload/read their own files:

1. In Firebase Console → **Storage** → **Rules** tab
2. Replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the file
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Products folder: Users can only upload/read/delete their own product images
    match /products/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
    
    // Receipts folder: Users can only upload/read/delete their own receipt images
    match /receipts/{userId}/{fileName} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
      allow delete: if isOwner(userId);
    }
  }
}
```

3. Click **Publish**

## File Structure

Images are stored in Firebase Storage with this structure:
```
/products/{userId}/{timestamp}-{filename}
/receipts/{userId}/{timestamp}-{filename}
```

## Features

- ✅ Upload images from device
- ✅ Add image URLs (for external images)
- ✅ Preview images before upload
- ✅ Delete images (removes from Storage)
- ✅ 5MB file size limit
- ✅ Image type validation
- ✅ Multiple images per product (up to 5)
- ✅ Single receipt image per receipt

## Troubleshooting

### "Permission denied" when uploading
- Check Storage security rules are published
- Verify you're logged in
- Check file size is under 5MB
- Verify file is an image type

### Images not displaying
- Check browser console for errors
- Verify image URLs are valid
- Check Storage rules allow read access

### Upload fails
- Check internet connection
- Verify Firebase Storage is enabled
- Check file size (max 5MB)
- Verify file is an image (jpg, png, gif, webp, etc.)

