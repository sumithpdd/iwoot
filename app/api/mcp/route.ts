import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { authorizeIwootMcp } from "@/lib/server/mcp/auth"
import { createIwootMcpServer } from "@/lib/server/mcp/iwoot-mcp-server"

export const runtime = "nodejs"
export const maxDuration = 60

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id, Last-Event-ID, x-api-key",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, WWW-Authenticate",
}

function withCors(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(cors)) headers.set(key, value)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors })
}

/** Hosted MCP: reject long-lived GET streams; clients should use POST. */
export async function GET(request: Request) {
  const auth = await authorizeIwootMcp(request)
  if ("response" in auth) return withCors(auth.response)
  return withCors(
    Response.json(
      {
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
      },
      { status: 405, headers: { Allow: "POST, DELETE" } }
    )
  )
}

async function handle(request: Request): Promise<Response> {
  const auth = await authorizeIwootMcp(request)
  if ("response" in auth) return withCors(auth.response)

  const server = createIwootMcpServer(auth.uid)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  return withCors(await transport.handleRequest(request))
}

export function POST(request: Request) {
  return handle(request)
}

export function DELETE(request: Request) {
  return handle(request)
}
