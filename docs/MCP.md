# IWOOT MCP (Claude, ChatGPT, Cursor)

Expose **I want** research and **I have** inventory / resale tools to external agents — same Streamable HTTP pattern as Customer Engagement Hub / Sitecore demos.

## Endpoint

```
POST https://iwoot.vercel.app/api/mcp
```

Also accepts `DELETE` for session teardown. `GET` returns 405 (clients should use POST).

## Auth

**Preferred:** open **[MCP settings](/mcp)** while signed in → mint an `iwootmcp_…` token (shown once) → use as Bearer. The page uses `McpService` → `/api/mcp/tokens` (no raw fetch). Tokens are hashed in Firestore (`mcpAccessTokens`); revoke anytime from that page.

**Legacy env (still supported):**

```
IWOOT_MCP_TOKEN=<long-random-secret>
IWOOT_MCP_USER_ID=<your-firebase-uid>
```

Also accepted: Firebase ID token as Bearer (full read+write for that user).

Send `Authorization: Bearer <token>` or `x-api-key`.

## Tools

### Inventory & resale (have)

| Tool | Purpose |
|------|---------|
| `list_inventory` | Want / have products |
| `get_product` | One product by id |
| `list_sell_compare_pages` | Resale compare slugs |
| `get_sell_compare` | Gumtree / CeX / Shpock rows |
| `draft_listing` | Draft marketplace copy |
| `record_live_listing` | Save live ad URL + £ ask |
| `update_listing_status` | not_listed / selling / sold |
| `update_have_disposition` | kept / selling / sold / gifted / recycled |
| `append_product_notes` | Append notes |

### Buying research (want)

| Tool | Purpose |
|------|---------|
| `list_want_research` | Baskets + want products overview |
| `get_want_details` | Full visits, benchmarks, plan |
| `upsert_want_basket` | Multi-item shopping plan |
| `upsert_want_product` | Create/update a want SKU |
| `add_research_visit` | Store / online check |
| `add_price_benchmark` | UK/US price row |
| `add_research_link` | Attach URL |
| `set_buying_plan_steps` | Buying checklist |
| `update_buying_stage` | researching → … → bought |
| `convert_want_to_have` | Mark purchased |

## Example prompts (Claude / ChatGPT)

> What am I researching to buy right now?

> Show details for my Orlando Apple basket — visits and UK prices.

> I checked John Lewis: iPad Pro 13 1TB nano-texture still £2,199 — add that benchmark.

> I bought the 46 mm Watch for £419 at Apple UK — convert that want to have.

> Draft a Gumtree ad for my Sonos Move and record the live listing at &lt;url&gt; for £200.

## In-app Gemini

Signed-in dashboard chat (`POST /api/chat`) uses the **same handlers** (`lib/server/ai/inventory-tool-handlers.ts`). Prefer tools when logging research so Claude/ChatGPT and the app share one Firestore truth (`products` + `wantBaskets`).

## Code layout (no duplicates)

| Concern | Module |
|---------|--------|
| Tool implementations | `lib/server/ai/inventory-tool-handlers.ts` |
| Gemini wrapper | `lib/server/ai/inventory-tools.ts` |
| MCP registration | `lib/server/mcp/iwoot-mcp-server.ts` |
| Product fuzzy match | `lib/utils/match-owned-product.ts` |
| Want research domain | `lib/server/resale/want-research.ts` |
| Live listing write | `lib/server/resale/record-live-listing.ts` |
| HTTP want baskets | `/api/want-baskets` + `WantBasketService` |
| MCP token UI | `/mcp` + `McpService` |

## Data model (short)

- **`wantBaskets`** — multi-item plan (title, visits, benchmarks, plan steps); also CRUD via `/api/want-baskets`
- **`products` type=want** — line items with `wantBasketId`, `buyingStage`, `researchVisits`, `priceBenchmarks`, `researchLinks`
- **`products` type=have** — ownership + `listingStatus` / `disposition` + sell-compare live rows
- **`mcpAccessTokens`** — hashed connector tokens (scopes `read` / `write`)
