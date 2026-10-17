---
name: iwoot-local-admin
description: One-off Firestore/Storage Admin scripts for IWOOT. Use when seeding or patching live inventory, attaching invoices, converting currencies, or the user asks to update products outside the UI. Never commit these scripts.
---

# Local Admin SDK scripts

One-off inventory work is **not part of the repo**. Scripts leak UIDs, emails, serials, and invoices if pushed.

## Where to put them

1. Create gitignored `.local-admin/` at the repo root (already in `.gitignore`).
2. Write a throwaway `.mjs` there. Use `firebase-service-account.json` (also gitignored).
3. Run it, confirm in the dashboard, then **delete the script** (or leave it only in `.local-admin/`).
4. Never add `scripts/` to git. `/scripts/` is gitignored.

Do not add `/api/seed/*` or dashboard seed buttons as a substitute.

## Script rules

- Hardcode the signed-in user’s UID only in `.local-admin/`, never in `app/` or `lib/`.
- Prefer updating existing docs (match name/brand/SKU) over inserting duplicates.
- Product photos and receipts: upload to Storage `users/{uid}/products/{productId}/images|receipts/`. Never write `public/receipts` or `public/catalog`.
- Convert foreign currency at the **purchase-date** rate; store GBP in `priceBought` / `totalAmount` and note original amount + rate in `notes`.

## After running

Do not commit `.env.local`, service accounts, `.local-admin/`, invoices, or product photos.

Inventory answers in AI chat come from Firestore on the next `/api/chat` request — no extra seed file.
