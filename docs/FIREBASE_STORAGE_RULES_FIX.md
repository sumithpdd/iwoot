# Fix Firebase Storage Permission Error

The app uploads through **`POST /api/storage/upload`** (Admin SDK), not the Firebase client Storage SDK. If you still see `storage/unauthorized`, you are likely calling the client SDK directly.

## Canonical rules

Use the repo file **`storage.rules`**:

```bash
npx firebase deploy --only storage
```

Or paste that file into Firebase Console → **Storage** → **Rules** → **Publish**.

Layout:

```
users/{userId}/products/{productId}/images/…
users/{userId}/products/{productId}/receipts/…
users/{userId}/receipts/{receiptId}/…
```

## If uploads fail with `accountDisabled`

GCP billing is off for the project. Enable billing, then retry. Do not put invoices or photos in `public/` / git.
