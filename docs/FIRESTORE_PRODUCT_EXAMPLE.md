# Example Firestore `products` document shape

Use this to compare against a real document in **Firebase Console → Firestore → `products` → (your doc)**. Field names match `lib/types/product.ts` and what the API accepts.

> **Note:** IDs (`id` on the client) are the Firestore document ID. Timestamps and `userId` are set by your app/API.

## “I have” — Apple AirPods–style (illustrative)

This is **fabricated example data**, not a dump from your database. Your AirPods row may omit optional fields or use legacy `images` as an array of URL strings.

```json
{
  "type": "have",
  "userId": "YOUR_AUTH_UID",
  "name": "Apple AirPods Pro 2",
  "brand": "Apple",
  "website": "https://www.apple.com/uk/airpods-pro/",
  "originalPrice": 229,
  "priceBought": 199.99,
  "date": "2025-11-15",
  "description": "<p>USB-C case. Light use; includes box and spare tips.</p>",
  "category": "Headphones",
  "model": "AirPods Pro 2nd generation",
  "sku": "MTJV3ZM/A",
  "color": "White",
  "condition": "Excellent",
  "notes": "Registered for AppleCare+ until 2026.",
  "specifications": {
    "Chip": "H2",
    "Case": "MagSafe Charging Case (USB-C)",
    "Noise cancellation": "Active"
  },
  "images": [
    {
      "url": "https://firebasestorage.googleapis.com/.../products%2FUID%2F....jpg",
      "tags": ["front", "box"]
    },
    {
      "url": "https://firebasestorage.googleapis.com/.../serial.jpg",
      "tags": ["serial"]
    }
  ],
  "storeId": "OPTIONAL_STORE_DOC_ID_OR_NULL",
  "purchaseLocation": "Apple Store Regent Street",
  "warrantyExpiry": "2026-11-15",
  "receiptId": "OPTIONAL_RECEIPT_DOC_ID",
  "listingStatus": "selling",
  "listingPlatforms": ["Gumtree", "eBay", "Facebook Marketplace"],
  "priceHistory": [
    {
      "price": 219,
      "date": "2025-12-01T10:00:00.000Z",
      "website": "Apple UK",
      "notes": "Price check"
    }
  ],
  "createdAt": "2025-11-15T12:00:00.000Z",
  "updatedAt": "2026-05-01T09:30:00.000Z",
  "createdByEmail": "you@example.com",
  "updatedByEmail": "you@example.com"
}
```

### Legacy `images` shape (still supported)

```json
"images": [
  "https://example.com/photo1.jpg",
  "https://example.com/photo2.jpg"
]
```

The app normalizes these to `{ url, tags? }[]` when validating/saving.

Older documents may still use `isSelling` (boolean) and `sellingOn` (single string); the UI maps those to the listing fields until you save again.

## “I want” — minimal extra fields

Same as `BaseProduct` plus `type: "want"`, optional `currentPrice`, `targetPrice`, `priceHistory`.

## Verify your real AirPods document

1. Open [Firebase Console](https://console.firebase.google.com/) → your project (must match `NEXT_PUBLIC_FIREBASE_PROJECT_ID`).
2. **Firestore** → collection **`products`** → open the document you care about.
3. Check:
   - `type` is `"have"` or `"want"`.
   - `userId` matches the account you use in the app.
   - Required: `name`, `brand`, `website`, `originalPrice`, `date`, `userId`; for **have**, also `priceBought`.
   - Optional maps/arrays match the shapes above.

If the **Console** shows good data but the **app** returns **401**, the issue is almost always **Admin SDK / service account** (see `docs/FIREBASE_SERVICE_ACCOUNT_SETUP.md` — API routes section): the server must verify ID tokens with a service account from the **same** Firebase project as the web client.
