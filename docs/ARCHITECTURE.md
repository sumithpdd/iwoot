# Architecture & Design Patterns

IWOOT is a Next.js 14 App Router app. **Firebase Auth runs in the browser. All Firestore and Storage writes go through Next.js API routes using the Admin SDK.** The client never uses the Firestore client SDK.

## Layers

```
React UI (client components)
        │  Bearer ID token
        ▼
lib/services/*          ← typed fetch helpers + client-side validation
        │  /api/*
        ▼
app/api/*               ← verify token, authorize, validate, audit
        │
        ▼
lib/server/repositories ← Admin SDK only (Firestore)
lib/server/storage-admin
```

| Layer | Location | Allowed to do |
| --- | --- | --- |
| UI | `components/`, `app/**/page.tsx` with `"use client"` | Forms, lists, call services. No Admin SDK, no Firestore. |
| Client SDK | `lib/firebase/config.ts` | **Auth (and Analytics) only.** |
| Services | `lib/services/*.service.ts` | `fetch` `/api/…` with `Authorization: Bearer`. |
| API | `app/api/**/route.ts` | `runtime = "nodejs"`. Verify ID token. |
| Repositories | `lib/server/repositories/` | Admin Firestore. Never import from client components. |

## Data: inventory vs sell-compare reference

**Source of truth for what the user owns** is Firestore (`products`, `receipts`, `stores`, `brands`), scoped by `userId`.

**Sell-compare venue prices** live in Firestore `sellComparePages` (shared reference, not per-user). Types in `lib/types/sell-compare.ts`. Do not store venue GBP/URLs in `lib/data/`. Optional product-spec panels may use `lib/data/*-product-reference.ts`. Suggested store names may remain in `lib/data/`.

Intentional Firestore denormalization (not duplication to remove):

- Product `brand` string + optional `brandId`
- Have product `purchaseLocation` + optional `storeId`

Lists stay readable without joins. Keep the string in sync when the user picks a profile.

## Request flow

**Create / update product**

1. `ProductDialog` — React Hook Form + Zod (UX only).
2. `ProductService` — `validateProduct` then `POST`/`PATCH` `/api/products`.
3. API — `getAuthContext`, strip client `userId`/`id`, verify `storeId`/`brandId` ownership, `validateProduct` again, repository write.

**AI chat + MCP**

- In-app Gemini (`POST /api/chat`): inventory context + tools (`list_inventory`, `get_sell_compare`, `draft_listing`).
- MCP (`POST /api/mcp`): same tools for Claude / ChatGPT / Cursor. Auth: Firebase ID token or `IWOOT_MCP_TOKEN` + `IWOOT_MCP_USER_ID`. See `docs/MCP.md`.
- Sell-compare is Firestore UK reference (Gumtree / CeX / Shpock). Primary pages: `/sell-compare/sonos-move`, `/sell-compare/nebula-cosmos-max`.

## React / Next.js conventions

- Sell-compare hub/`[slug]` are dynamic Server Components (Admin SDK). Interactive dashboard/dialogs are client components.
- One concern per module: dialogs submit through services; API routes do not render UI.
- Do not add unused hooks. Dashboard loads products/receipts/stores/brands together in the page — that is the container. Extract a hook only when two screens share the same state machine.
- Images: Firebase Storage at `users/{uid}/products/{productId}/images|receipts/…`. Never commit `public/receipts` or `public/catalog`.

## Firebase conventions

- Security rules still require `userId == auth.uid` for client access; production data access is Admin SDK after token verify.
- Never commit `firebase-service-account.json`, `.env.local`, or one-off Admin scripts.
- One-off inventory patches belong in gitignored `.local-admin/` (see project skill `iwoot-local-admin`).

## Validation

| Where | Role |
| --- | --- |
| Zod in dialogs | Immediate form errors |
| `lib/validators/*` | Shared rules; **API is authoritative** |
| `lib/utils/http-url.ts` | Absolute URLs vs `/catalog/` and `/receipts/` paths |

Do not copy `isValidUrl` into each validator.

## Ownership FKs

`verifyStoreIdForUser` / `verifyBrandIdForUser` wrap `verifyOwnedIdForUser`. Empty id clears the link; a set id must exist and belong to the caller.

## What not to add

- Client Firestore CRUD (`lib/firebase/products.ts` does not exist).
- `/api/seed/*` routes or dashboard “seed demo” buttons.
- Committed `scripts/*.mjs` that hardcode UIDs, emails, or invoices.
- A second product list in `lib/data` that mirrors Firestore.

## Related docs

- `docs/DEVELOPER_GUIDE.md` — file map
- `docs/QUICK_REFERENCE.md` — service call snippets
- `docs/FIRESTORE_RULES.md` — rules
- `docs/SELLING_AND_COMPARE.md` — static compare pages
