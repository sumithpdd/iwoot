# IWOOT MCP (Claude, ChatGPT, Cursor)

Expose inventory and sell-compare tools to external agents — same Streamable HTTP approach as SitecoreAiDemoSenario’s `/api/mcp`.

## Endpoint

```
POST https://<your-host>/api/mcp
```

Also accepts `DELETE` for session teardown. `GET` returns 405 (clients should use POST).

Production example: `https://iwoot.vercel.app/api/mcp`

## Auth

Set in `.env.local` / Vercel:

```
IWOOT_MCP_TOKEN=<long-random-secret>
IWOOT_MCP_USER_ID=<your-firebase-uid>
```

Send either:

- `Authorization: Bearer <IWOOT_MCP_TOKEN>`
- `x-api-key: <IWOOT_MCP_TOKEN>`
- or a Firebase **ID token** as Bearer (scopes to that user)

## Tools

| Tool | Purpose |
|------|---------|
| `list_inventory` | Want / have products |
| `get_product` | One product by id |
| `list_sell_compare_pages` | Compare page slugs |
| `get_sell_compare` | Venue rows (Gumtree / CeX / Shpock) |
| `draft_listing` | Draft title + body for a have item |
| `record_live_listing` | After you post: save URL + £ ask, mark selling, update sell-compare |
| `update_listing_status` | `not_listed` / `selling` / `sold` |

### `record_live_listing` (replaces one-off Admin scripts)

Example prompt for Claude / ChatGPT:

> I posted my Sonos Move on Gumtree for £200 at  
> https://www.gumtree.com/p/speakers/.../1803980797 — record that.

Tool args:

```json
{
  "query": "Sonos Move",
  "platform": "Gumtree",
  "url": "https://www.gumtree.com/...",
  "priceGbp": 200,
  "location": "Isle of Dogs"
}
```

Infers sell-compare slug (`sonos-move`, `nebula-cosmos-max`, …) from the product name when `sellCompareSlug` is omitted.

## Claude / ChatGPT

1. Deploy the app with the env vars above (Production + Development).
2. Add a custom MCP / connector pointing at `https://iwoot.vercel.app/api/mcp` with header `Authorization: Bearer <IWOOT_MCP_TOKEN>`.
3. Ask things like:
   - “What am I selling?”
   - “Draft a Gumtree ad for Nebula”
   - “I listed Nebula on Shpock for £1000 at &lt;url&gt; — record it”

In-app Gemini chat (`/api/chat`) exposes the same write tools when you are signed in.

## Local streaming UI

The floating **IWOOT · Gemini** panel already calls `/api/chat` with your Firebase token and can list inventory, draft listings, and record live ads without MCP.
