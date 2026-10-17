---
name: iwoot-resale-mcp
description: IWOOT inventory tracking, sell-compare (Gumtree/CeX/Shpock), Gemini chat tools, and MCP for Claude/ChatGPT. Use when selling Sonos Move or Nebula, drafting listings, wiring MCP, or explaining the app purpose.
---

# IWOOT resale + MCP

## App purpose

Personal tracker for products you **want** or **have**: purchase prices, receipts, listing status, and static UK **sell-compare** grids for Gumtree, CeX (webuy), and Shpock.

## Sell-compare (static)

| Item | Path | Data |
|------|------|------|
| Sonos Move (S17) | `/sell-compare/sonos-move` | `lib/data/sonos-move-venue-prices.ts` |
| Nebula Cosmos Max | `/sell-compare/nebula-cosmos-max` | `lib/data/nebula-cosmos-max-venue-prices.ts` |
| Registry | — | `lib/data/sell-compare-catalog.ts` |

Do not confuse **Move** (S17) with **Move 2**. Inventory is Firestore; sell-compare is not.

## Gemini in-app chat

- `POST /api/chat` — tools: `list_inventory`, `get_sell_compare`, `draft_listing`, …
- UI: `components/ai-chat-panel.tsx` (quick prompts for Sonos / Nebula sell help)

## MCP (Claude / ChatGPT / Cursor)

- Endpoint: `POST /api/mcp` (Streamable HTTP, same pattern as SitecoreAiDemoSenario)
- Auth: Firebase ID token **or** `IWOOT_MCP_TOKEN` + `IWOOT_MCP_USER_ID` in env
- Tools: `list_inventory`, `get_product`, `list_sell_compare_pages`, `get_sell_compare`, `draft_listing`

Example connector URL: `https://<host>/api/mcp` with header `Authorization: Bearer <IWOOT_MCP_TOKEN>`.

## Listing fields

Have products: `listingStatus` = `selling`, `listingPlatforms` includes Gumtree / CeX / Shpock. Mark via UI or `.local-admin/` only (never commit scripts with UIDs).
