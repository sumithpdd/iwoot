# Selling on marketplaces & price compare

This guide describes the **user journey** for second-hand selling workflows in IWOOT and where developers maintain related UI and data.

## User journey (dashboard)

After sign-in, the **dashboard** (`/dashboard`) is the home surface:

1. **Sell compare hub** — Top navigation includes **Sell compare** → `/sell-compare` (Firestore-backed venue grids, not live scraping).
2. **Selling journey card** — A guided card above the main tabs outlines:
   - Save **Stores** (retailers or places you buy from).
   - Add an **“I have”** product with **photos** and optional **store** link.
   - Open **price compare** for rough resale reference.
   - Optionally add **Receipts** (warranty, price proof); store profiles can be prefilled from a receipt.

The main **tabs** are **Products**, **Receipts**, **Stores**, and **Brands**. Tab state is controlled so buttons on the journey card switch the visible tab reliably.

## Products: fields that matter for resale

### Shared

- **Website** — Required valid URL; can be a retail product page or a marketplace listing you are copying from.
- **Product lookup** — Barcode/name search can auto-fill name, brand, description, images, etc. (see `docs/PRODUCT_LOOKUP.md`).
- **Description** — Rich text (HTML) via TipTap; stored as HTML and **sanitized** when rendered in lists (`ProductDescriptionDisplay`). Plain-text is used for search and clipboard copy.
- **Technical specifications** — Optional key/value rows (e.g. “Storage”, “Colour”); searchable from the dashboard search bar.
- **Images** — Firebase Storage uploads (`ImageUpload`); first image is the primary thumbnail. Optional per-image tags.

### “I have” only

- **Saved store profile** — Optional `storeId` linking to a document under **Stores**.
- **Purchase location** — Free text if you do not use a saved store.
- **Listing** — `listingStatus`: `not_listed` | `selling` | `sold`; `listingPlatforms[]` multi-select for marketplaces; when **sold**, use `soldAt` and `soldWhere`. Legacy `isSelling` / `sellingOn` are still read until you re-save the product.
- **Brand profile** — Optional `brandId` linking to a **Brands** document (keeps the display `brand` string in sync when you pick a profile).

The product dialog includes short helper copy for photos and selling, plus a link to the **price compare hub**.

## Stores

**Stores** (`StoreDialog`, **Stores** tab) are user-scoped profiles (name, optional website, address, phone, notes). They exist so **“I have”** products and **receipts** stay organised. Creating a store from a receipt draft is supported from the product dialog when a receipt is linked.

Bag: `stores` collection; each document should include `userId` for security rules (see `docs/FIRESTORE_RULES.md`).

## Brands

**Brands** (`BrandDialog`, **Brands** tab) are user-scoped manufacturer / label profiles (name, optional website, notes). Link them from any product via **Saved brand profile**.

Collection: `brands` — same ownership pattern as stores (`userId`). Publish matching rules from `docs/FIRESTORE_RULES.md` (console or CLI).

## Price compare (`/sell-compare`)

Venue prices live in Firestore collection **`sellComparePages`** (doc id = slug). Types: **`lib/types/sell-compare.ts`**. Repo: **`lib/server/repositories/sell-compare.repository.ts`**. Routes: hub `/sell-compare` + dynamic `/sell-compare/[slug]`.

| Slug | Notes |
|------|--------|
| `sonos-move` | Original Move S17 — Gumtree / CeX / Shpock |
| `nebula-cosmos-max` | Nebula Cosmos Max D2150 |
| `airpods-pro-2` | Back Market, CeX, Gumtree, Shpock |
| `sonos-move-2` | Move 2 reference only (not S17) |

Each doc: `title`, `blurb`, `intro`, `path`, `venues[]` (`VenuePriceRow`), `sortOrder`, `published`, optional `referencePanel`.

Update prices in Firebase Console (or a `.local-admin` Admin script). Do **not** put venue prices back in `lib/data/`.

External agents: see **`docs/MCP.md`**. In-app Gemini: floating chat panel with inventory tools.

UI building blocks:

- `components/selling-venue-price-grid.tsx` — Responsive table / cards.
- `components/selling-journey-card.tsx` — Dashboard onboarding card.

## Developer utilities

| Area | Location |
|------|-----------|
| Sanitize product HTML | `lib/utils/sanitize-product-html.ts` |
| HTML → plain text (search, previews) | `lib/utils/html-plain-text.ts` |
| Product + spec validation | `lib/validators/product.validator.ts` (`validateDescriptionAndSpecs`) |
| Rich editor | `components/rich-text-editor.tsx` (TipTap) |
| Spec editor | `components/product-specifications-editor.tsx` |
| Render description in lists | `components/product-description-display.tsx` |

Tailwind **typography** plugin is enabled for prose-style description blocks where HTML is shown.

## Related documentation

- `docs/PRODUCT_LOOKUP.md` — Auto-fill from barcode / name / URL.
- `docs/FIREBASE_STORAGE_SETUP.md` — Image uploads.
- `docs/PROJECT_OVERVIEW.md` — High-level features and schema overview.
