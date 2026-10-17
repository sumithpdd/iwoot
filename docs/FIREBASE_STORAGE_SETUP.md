# Firebase Storage Setup

Uploads go through **`POST /api/storage/upload`** (Admin SDK). The browser does not write to Storage directly.

## Enable Firebase Storage

1. Firebase Console → **Storage** → **Get started**
2. Use the same GCP project as Auth/Firestore (billing must be enabled)

## Object layout

```
users/{userId}/products/{productId}/images/{timestamp}-{filename}
users/{userId}/products/{productId}/receipts/{timestamp}-{filename}
users/{userId}/receipts/{receiptId}/{timestamp}-{filename}
```

New products/receipts generate a client UUID before the first upload so files land under the same id as the Firestore document (`clientId` on create).

Do **not** put invoices or personal photos in `public/` or git. `public/receipts/` and `public/catalog/` are gitignored.

## Security rules

Canonical file: **`storage.rules`**. Deploy with:

```bash
npx firebase deploy --only storage
```

Or paste the same rules in Console → Storage → Rules. Uploads via Admin SDK bypass rules; rules still protect any client SDK access.

## Limits

- Images: 5MB, `image/*`
- Receipt PDFs: 10MB, `application/pdf`

## Troubleshooting

- **`accountDisabled` / billing**: enable billing on the GCP project.
- **Permission denied** on a client SDK upload: the app should use `/api/storage/upload`, not the client Storage SDK.
- **Images not displaying**: download URLs include `alt=media&token=`; `next/image` uses `unoptimized` for these URLs.
