# IWOOT MCP (Claude, ChatGPT, Cursor)

Expose **I want** research and **I have** inventory / resale tools to external agents — same Streamable HTTP pattern as Customer Engagement Hub / Sitecore demos.

## Endpoint

```
POST https://iwoot.vercel.app/api/mcp
```

Also accepts `DELETE` for session teardown. `GET` returns 405 (clients should use POST).

Unauthenticated calls return **401** with `WWW-Authenticate: Bearer resource_metadata="…/.well-known/oauth-protected-resource/api/mcp"` so ChatGPT can start OAuth.

## ChatGPT (OAuth — required)

ChatGPT Apps / custom MCP **do not** accept a static `Authorization: Bearer` header from a pasted JSON client config. Use OAuth:

1. Set Vercel env **`NEXT_PUBLIC_APP_URL=https://iwoot.vercel.app`** (exact production origin; used as OAuth `issuer`).
2. ChatGPT → Settings → Apps → Developer mode / Create app / Add custom MCP server.
3. Name: **iWoot**. Server URL: `https://iwoot.vercel.app/api/mcp`.
4. Authentication: **OAuth** (not “no authentication”).
5. Continue → browser opens `/oauth/authorize` → sign in to IWOOT → **Allow access**.

Discovery endpoints (no auth):

| URL | Role |
|-----|------|
| `/.well-known/oauth-protected-resource/api/mcp` | Resource metadata → authorization servers |
| `/.well-known/oauth-authorization-server` | AS metadata (authorize / token / register) |
| `/oauth/authorize` | Consent UI (PKCE) |
| `/api/oauth/token` | Code → `iwootmcp_…` access token |
| `/api/oauth/register` | Optional DCR for clients that need it |

## Claude (web, desktop, mobile) — Bearer header

Custom connectors share one list across Claude web, desktop, and mobile. Available on Free / Pro / Max / Team / Enterprise (Free: one custom connector).

1. Open **[MCP settings](/mcp)** → mint an `iwootmcp_…` token (shown once).
2. Claude → **Settings → Connectors** → **Add** → **Custom → Web**.
3. **Name:** `iwoot`  
   **URL:** `https://iwoot.vercel.app/api/mcp`
4. Open **Request headers**. Header name: `Authorization`.  
   **Value:** `Bearer iwootmcp_…` — include the word `Bearer` and the space; Claude does **not** add a scheme for you.
5. Save, then turn **iwoot** on from the tools menu in a chat.

If you do not see **Request headers**, that beta has not reached your account yet — use Claude Code (below) or ChatGPT OAuth until it does.

### Claude Code

```bash
claude mcp add --transport http iwoot https://iwoot.vercel.app/api/mcp \
  --header "Authorization: Bearer iwootmcp_…your-token…"
```

### Cursor / local JSON

```json
{
  "mcpServers": {
    "iwoot": {
      "url": "https://iwoot.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer iwootmcp_…your-token…" }
    }
  }
}
```

Tokens are hashed in Firestore (`mcpAccessTokens`); revoke anytime on `/mcp`. If a token appears in a chat transcript, revoke it and mint a new one.

**Legacy env (still supported):**

```
IWOOT_MCP_TOKEN=<long-random-secret>
IWOOT_MCP_USER_ID=<your-firebase-uid>
```

Also accepted: Firebase ID token as Bearer (full read+write for that user), or `x-api-key`.

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
| `upsert_want_product` | Create/update want SKU (**set `description`**, auto brand, optional `imageUrls`) |
| `list_brands` / `upsert_brand` | Brand profiles |
| `attach_brand_to_product` | Link Apple/etc. brand to a product |
| `attach_product_images` | Store photos from **direct** image URLs (not gallery HTML) |
| `add_research_visit` | Store / online check |
| `add_price_benchmark` | UK/US price row |
| `add_research_link` | Attach URL (bookmarks only — not product photos) |
| `set_buying_plan_steps` | Buying checklist |
| `update_buying_stage` | researching → … → bought |
| `convert_want_to_have` | Mark purchased |

**Photos via ChatGPT:** MCP cannot receive binary uploads. Ask for direct `https://…jpg` (or `data:image;base64,…`) and call `attach_product_images` / `upsert_want_product.imageUrls`. Apple gallery / product-page HTML links belong in `add_research_link`, not as photos.

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
| OAuth AS (ChatGPT) | `lib/server/mcp/oauth.ts` + `/oauth/authorize` + `/api/oauth/*` |

## Data model (short)

- **`wantBaskets`** — multi-item plan (title, visits, benchmarks, plan steps); also CRUD via `/api/want-baskets`
- **`products` type=want** — line items with `wantBasketId`, `buyingStage`, `researchVisits`, `priceBenchmarks`, `researchLinks`
- **`products` type=have** — ownership + `listingStatus` / `disposition` + sell-compare live rows
- **`mcpAccessTokens`** — hashed connector tokens (scopes `read` / `write`)
