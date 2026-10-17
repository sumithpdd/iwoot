# IWOOT MCP (Claude, ChatGPT, Cursor)

Expose inventory and sell-compare tools to external agents — same Streamable HTTP approach as SitecoreAiDemoSenario’s `/api/mcp`.

## Endpoint

```
POST https://<your-host>/api/mcp
```

Also accepts `DELETE` for session teardown. `GET` returns 405 (clients should use POST).

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

## Claude / ChatGPT

1. Deploy the app with the env vars above.
2. Add a custom MCP / connector pointing at `/api/mcp`.
3. Ask: “What am I selling?” or “Draft a Gumtree ad for Sonos Move.”

In-app Gemini chat (`/api/chat`) uses the same tool ideas without MCP.

## Local streaming UI

The floating **IWOOT · Gemini** panel already calls `/api/chat` with your Firebase token and can list inventory / draft listings without MCP.
