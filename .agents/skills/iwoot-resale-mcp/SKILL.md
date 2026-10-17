---
name: iwoot-resale-mcp
description: IWOOT inventory tracking, sell-compare (Gumtree/CeX/Shpock), Gemini chat tools, and MCP for Claude/ChatGPT. Use when selling Sonos Move or Nebula, drafting listings, wiring MCP, or explaining the app purpose.
---

# IWOOT resale + MCP

## App purpose

Personal tracker for products you **want** or **have**: purchase prices, receipts, listing status, and UK **sell-compare** grids for Gumtree, CeX (webuy), and Shpock.

## Sell-compare (Firestore)

| Item | Path | Data |
|------|------|------|
| Hub | `/sell-compare` | `listSellComparePages()` |
| Page | `/sell-compare/[slug]` | `getSellComparePageBySlug(slug)` |
| Collection | — | `sellComparePages/{slug}` with embedded `venues[]` |
| Types | — | `lib/types/sell-compare.ts` |
| Repo | — | `lib/server/repositories/sell-compare.repository.ts` |

Do not confuse **Move** (S17) with **Move 2**. Inventory is user-scoped products; sell-compare is shared reference docs. Never put venue prices in `lib/data/`.

Bulk seed / one-off patches: `.local-admin/` (skill `iwoot-local-admin`). Day-to-day live ads: MCP / chat tool `record_live_listing`.

## Gemini in-app chat

- `POST /api/chat` — tools: `list_inventory`, `get_sell_compare`, `draft_listing`, `record_live_listing`, `update_listing_status`, …
- UI: `components/ai-chat-panel.tsx` (quick prompts for Sonos / Nebula sell help)

## MCP (Claude / ChatGPT / Cursor)

- Endpoint: `POST /api/mcp` (Streamable HTTP)
- Auth: Firebase ID token **or** `IWOOT_MCP_TOKEN` + `IWOOT_MCP_USER_ID` in env
- Tools: `list_inventory`, `get_product`, `list_sell_compare_pages`, `get_sell_compare`, `draft_listing`, **`record_live_listing`**, **`update_listing_status`**

Example: “I posted Sonos Move on Gumtree for £200 at &lt;url&gt; — record it.”

Connector URL: `https://<host>/api/mcp` with header `Authorization: Bearer <IWOOT_MCP_TOKEN>`. See `docs/MCP.md`.

## Listing fields

Have products: `listingStatus` = `selling`, `listingPlatforms` includes Gumtree / CeX / Shpock. Prefer `record_live_listing` from MCP/chat over committed Admin scripts.
