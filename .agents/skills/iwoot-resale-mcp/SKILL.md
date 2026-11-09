---
name: iwoot-resale-mcp
description: IWOOT inventory tracking, want research (baskets/visits/benchmarks), sell-compare (Gumtree/CeX/Shpock), Gemini chat tools, and MCP for Claude/ChatGPT. Use when buying research, selling Sonos/Nebula, drafting listings, or wiring MCP.
---

# IWOOT — I want / I have + MCP

## App purpose

Personal tracker for products you **want** (research, store visits, UK/US price benchmarks, buying plans) and **have** (purchase prices, receipts, listing status, resale).

## Want research (Firestore)

| Collection | Role |
|------------|------|
| `wantBaskets/{id}` | Multi-item plan (e.g. iPad + watches + keyboard) |
| `products` `type=want` | Line items; `wantBasketId`, `buyingStage`, `researchVisits[]`, `priceBenchmarks[]`, `researchLinks[]`, `buyingPlanSteps[]` |

Types: `lib/types/want-research.ts`, `lib/types/want-basket.ts`. Logic: `lib/server/resale/want-research.ts`.

HTTP (UI must use service): `WantBasketService` → `/api/want-baskets`.

Lifecycle: `researching` → `shortlisted` → `ready_to_buy` → `ordered` → `bought` (`convert_want_to_have`) → have disposition `kept` / `selling` / `sold` / `gifted` / `recycled`.

## Sell-compare (have / resale)

| Path | Data |
|------|------|
| `/sell-compare/[slug]` | `sellComparePages/{slug}` venues |
| Repo | `lib/server/repositories/sell-compare.repository.ts` |

## Shared AI tools (do not fork)

| Module | Role |
|--------|------|
| `lib/server/ai/inventory-tool-handlers.ts` | Single implementation for chat + MCP |
| `lib/server/ai/inventory-tools.ts` | Gemini binding |
| `lib/server/mcp/iwoot-mcp-server.ts` | MCP binding |
| `lib/utils/match-owned-product.ts` | Fuzzy product match |

## Gemini in-app chat

- `POST /api/chat` — full tool set (want + have)
- UI: `components/ai-chat-panel.tsx`

## MCP (Claude / ChatGPT / Cursor)

- UI: `/mcp` via `McpService` → `/api/mcp/tokens`
- `POST /api/mcp` — Streamable HTTP
- Auth: minted token, Firebase ID token, **or** legacy `IWOOT_MCP_TOKEN` + `IWOOT_MCP_USER_ID`
- Tools: see `docs/MCP.md`

Example: “What am I researching?” / “Add Best Buy visit…” / “Record Gumtree listing…”

## Listing fields (have)

`listingStatus` + `listingPlatforms`; prefer `record_live_listing` from MCP/chat. One-off Admin: `.local-admin/` only.
Architecture rules: skill `iwoot-architecture`.
