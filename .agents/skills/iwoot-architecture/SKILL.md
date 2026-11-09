---
name: iwoot-architecture
description: IWOOT app architecture for Next.js 14, React, and Firebase. Use when adding APIs, Firestore fields, products/receipts/stores/brands, AI chat, sell-compare pages, or when choosing where code belongs (client vs API vs Admin SDK).
---

# IWOOT architecture

## Non-negotiables

- Browser: Firebase **Auth only** (`lib/firebase/config.ts`). No Firestore client SDK.
- Data: Next.js Route Handlers + Admin SDK (`lib/server/repositories/`, `lib/server/storage-admin.ts`).
- UI calls `lib/services/*.service.ts` with a Bearer ID token — **no raw `fetch("/api/…")` in pages/components**. Never import repositories in client components.
- User inventory lives in Firestore (`products`, `wantBaskets`, …). Sell-compare venue prices live in Firestore `sellComparePages` (not `lib/data/`). Optional product-spec panels may still use `lib/data/*-product-reference.ts`.
- AI chat (`app/api/chat`) and MCP (`app/api/mcp`) share `createInventoryToolHandlers` — do not fork tool logic. Prefer tools for inventory/research answers.
- Product fuzzy match: only `lib/utils/match-owned-product.ts`.
- Media: Firebase Storage only, `users/{uid}/products/{productId}/…`. Never commit receipts or product photos.

## Layers

```
UI → services → app/api → domain (resale/ai) → repositories (Admin)
```

| Resource | Service | API |
|----------|---------|-----|
| Products | `ProductService` | `/api/products` |
| Want baskets | `WantBasketService` | `/api/want-baskets` |
| MCP tokens | `McpService` | `/api/mcp/tokens` (+ UI `/mcp`) |

API routes: verify token (`getAuthContext` / `getUidFromRequest`), ignore client `userId`, validate with `lib/validators` (incl. research/`disposition`), check store/brand FKs via `verifyOwnedIdForUser` wrappers.

## Denormalization (keep)

Product `brand` + optional `brandId`; have `purchaseLocation` + optional `storeId`. Display strings plus optional profile links. Do not “normalize away” the strings.

## Do not add

- `/api/seed/*` or UI seed-demo buttons
- Committed Admin scripts with UIDs or invoices (use skill `iwoot-local-admin`)
- Duplicate `isValidUrl` helpers (use `lib/utils/http-url.ts`)
- Duplicate `matchProduct` / second inventory-tool registries
- Unused hooks that duplicate dashboard fetch logic

## Forms

Zod in dialogs for UX. `lib/validators` on the API is the source of truth.

Full write-up: `docs/ARCHITECTURE.md`. Skill `iwoot-resale-mcp` for want/have + MCP.
