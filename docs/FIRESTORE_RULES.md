# Firestore Security Rules

Complete guide for setting up Firestore security rules for IWOOT.

## Problem
You're seeing "Missing or insufficient permissions" errors because Firestore security rules haven't been configured yet.

## Solution

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your Firebase project
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Update Security Rules

Replace the existing rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Products Collection
    match /products/{productId} {
      // Allow read if user owns the product
      allow read: if isOwner(resource.data.userId);
      
      // Allow create if user is authenticated and sets their own userId
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid;
      
      // Allow update if user owns the product
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == request.auth.uid;
      
      // Allow delete if user owns the product
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Receipts Collection
    match /receipts/{receiptId} {
      // Allow read if user owns the receipt
      allow read: if isOwner(resource.data.userId);
      
      // Allow create if user is authenticated and sets their own userId
      allow create: if isAuthenticated() 
                    && request.resource.data.userId == request.auth.uid;
      
      // Allow update if user owns the receipt
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.userId == request.auth.uid;
      
      // Allow delete if user owns the receipt
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Users Collection (for future use)
    match /users/{userId} {
      // Allow read if user is viewing their own data
      allow read: if isOwner(userId);
      
      // Allow write if user is updating their own data
      allow write: if isOwner(userId);
    }
  }
}
```

### Step 3: Publish the Rules
1. Click **Publish** button
2. Wait for confirmation that rules are published

### Step 4: Test
1. Refresh your application
2. The permission errors should be gone
3. You should be able to create and view products

## For Development (Temporary - NOT for Production)

If you want to test quickly without setting up rules, you can temporarily use test mode:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2025, 12, 31);
    }
  }
}
```

**⚠️ WARNING**: This allows anyone to read/write your database. Only use for development and change it immediately after testing!

## Troubleshooting

### Still getting permission errors?
1. Make sure you're logged in (check authentication)
2. Verify the rules were published (check the Rules tab)
3. Wait a few seconds for rules to propagate
4. Check browser console for specific error messages

### Rules not saving?
1. Make sure you have the correct permissions in Firebase
2. Try refreshing the Firebase Console page
3. Check for syntax errors in the rules (they should validate before publishing)

## Security Best Practices

1. **Always require authentication** - Never allow anonymous access
2. **Validate userId** - Always check that users can only access their own data
3. **Validate input** - Check that data being written matches expected structure
4. **Test rules** - Use the Rules Playground in Firebase Console to test

## Next Steps

After setting up rules:
1. Try creating a product
2. Try viewing your products
3. Try creating a receipt
4. Everything should work now!

