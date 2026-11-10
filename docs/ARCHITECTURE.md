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
lib/server/resale/*     ← domain logic (want research, live listings)
lib/server/ai/*         ← shared chat/MCP tool handlers
```

| Layer | Location | Allowed to do |
| --- | --- | --- |
| UI | `components/`, `app/**/page.tsx` with `"use client"` | Forms, lists, call **services only**. No raw `fetch("/api/…")`, no Admin SDK, no Firestore. |
| Client SDK | `lib/firebase/config.ts` | **Auth (and Analytics) only.** |
| Services | `lib/services/*.service.ts` | `apiRequest` → `/api/…` with Bearer. One service per resource. |
| API | `app/api/**/route.ts` | `runtime = "nodejs"`. Verify ID token (or MCP token). |
| Domain | `lib/server/resale/`, `lib/server/ai/` | Shared business logic used by API + chat + MCP. |
| Repositories | `lib/server/repositories/` | Admin Firestore. Never import from client components. |

### Robust coding rules

1. **Everything through API** — UI → `*Service` → Route Handler → repository / domain. Exceptions: public catalog lookups (`lib/catalog/*`), Storage upload helper that already posts to `/api/storage`.
2. **No duplicate matchers** — product fuzzy match is `matchOwnedProduct` in `lib/utils/match-owned-product.ts` (chat, MCP, record-live-listing, want-research).
3. **One tool surface** — `createInventoryToolHandlers` in `lib/server/ai/inventory-tool-handlers.ts`; thin wrappers in `inventory-tools.ts` (Gemini) and `iwoot-mcp-server.ts` (MCP).
4. **Validators are authoritative** — Zod in dialogs is UX only; `lib/validators/*` on PATCH/POST is the gate (including `buyingStage`, `disposition`, research arrays).
5. **Shared URL helpers** — `lib/utils/http-url.ts` only; do not copy `isValidUrl`.

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

- In-app Gemini (`POST /api/chat`): inventory context + tools from `createInventoryToolHandlers`.
- MCP (`POST /api/mcp`): **same handlers**. ChatGPT uses OAuth (`/oauth/authorize` + `/api/oauth/token`); Claude/Cursor use minted `iwootmcp_…` Bearer (`McpService`). Also Firebase ID token or legacy `IWOOT_MCP_TOKEN`. See `docs/MCP.md`.
- Want baskets: Firestore `wantBaskets` + HTTP `/api/want-baskets` via `WantBasketService`.
- Sell-compare: Firestore UK reference (Gumtree / CeX / Shpock). Primary pages: `/sell-compare/sonos-move`, `/sell-compare/nebula-cosmos-max`.

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

## Client services (must use)

| Resource | Service | API |
| --- | --- | --- |
| Products | `ProductService` | `/api/products` |
| Receipts | `ReceiptService` | `/api/receipts` |
| Stores / brands | `StoreService` / `BrandService` | `/api/stores`, `/api/brands` |
| Want baskets | `WantBasketService` | `/api/want-baskets` |
| MCP tokens | `McpService` | `/api/mcp/tokens` |
| Product AI assist | `AiProductAssistService` | `/api/ai/product-assist` |

## Related docs

- `docs/DEVELOPER_GUIDE.md` — file map
- `docs/QUICK_REFERENCE.md` — service call snippets
- `docs/MCP.md` — Claude / ChatGPT connector
- `docs/FIRESTORE_RULES.md` — rules
- `docs/SELLING_AND_COMPARE.md` — compare pages
