import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import {
  LIVE_LISTING_PLATFORMS,
  createInventoryToolHandlers,
} from "@/lib/server/ai/inventory-tool-handlers"

const BUYING_STAGE_ENUM = [
  "researching",
  "shortlisted",
  "ready_to_buy",
  "ordered",
  "bought",
  "cancelled",
] as const

function textResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {}),
  }
}

function isErrorPayload(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  )
}

function isOkFalse(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok: unknown }).ok === false
  )
}

type McpScopes = { read?: boolean; write?: boolean }

/**
 * MCP tools for Claude / ChatGPT / Cursor — same handlers as Gemini chat.
 */
export function createIwootMcpServer(
  uid: string,
  scopes: McpScopes = { read: true, write: true }
): McpServer {
  const canWrite = scopes.write !== false
  const h = createInventoryToolHandlers(uid)
  const server = new McpServer({
    name: "iwoot",
    version: "0.2.0",
  })

  const wrap = async (fn: () => Promise<unknown>) => {
    const data = await fn()
    return textResult(data, isErrorPayload(data) || isOkFalse(data))
  }

  server.registerTool(
    "list_inventory",
    {
      description: "List IWOOT want/have products for the authenticated user.",
      inputSchema: { type: z.enum(["all", "want", "have"]).default("all") },
    },
    async (args) => wrap(() => h.list_inventory(args))
  )

  server.registerTool(
    "get_product",
    {
      description: "Get one product by id (must belong to the user).",
      inputSchema: { productId: z.string() },
    },
    async (args) => wrap(() => h.get_product(args))
  )

  server.registerTool(
    "list_sell_compare_pages",
    {
      description: "List Firestore sell-compare pages.",
    },
    async () => wrap(() => h.list_sell_compare_pages())
  )

  server.registerTool(
    "get_sell_compare",
    {
      description: "Venue price rows for a sell-compare slug.",
      inputSchema: { slug: z.string() },
    },
    async (args) => wrap(() => h.get_sell_compare(args))
  )

  server.registerTool(
    "list_want_research",
    {
      description: "Overview of want baskets and want products.",
    },
    async () => wrap(() => h.list_want_research())
  )

  server.registerTool(
    "get_want_details",
    {
      description: "Full want product or basket research payload.",
      inputSchema: { query: z.string() },
    },
    async (args) => wrap(() => h.get_want_details(args))
  )

  server.registerTool(
    "list_brands",
    { description: "List brand profiles.", inputSchema: {} },
    async () => wrap(() => h.list_brands())
  )

  if (!canWrite) {
    return server
  }

  server.registerTool(
    "draft_listing",
    {
      description: "Draft marketplace listing title/body from a have product.",
      inputSchema: {
        query: z.string(),
        platform: z.enum(LIVE_LISTING_PLATFORMS).default("Gumtree"),
      },
    },
    async (args) => wrap(() => h.draft_listing(args))
  )

  server.registerTool(
    "record_live_listing",
    {
      description: "Record a live Gumtree/Shpock/etc. ad URL and asking price.",
      inputSchema: {
        query: z.string(),
        platform: z.enum(LIVE_LISTING_PLATFORMS),
        url: z.string().url(),
        priceGbp: z.number().nonnegative(),
        sellCompareSlug: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        setWebsite: z.boolean().optional(),
      },
    },
    async (args) => wrap(() => h.record_live_listing(args))
  )

  server.registerTool(
    "update_listing_status",
    {
      description: "Set listingStatus: not_listed | selling | sold.",
      inputSchema: {
        query: z.string(),
        listingStatus: z.enum(["not_listed", "selling", "sold"]),
        soldWhere: z.string().optional(),
        soldAt: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.update_listing_status(args))
  )

  server.registerTool(
    "upsert_want_basket",
    {
      description: "Create/update a multi-item want shopping plan.",
      inputSchema: {
        basketId: z.string().optional(),
        title: z.string(),
        blurb: z.string().optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM).optional(),
        targetTotalGbp: z.number().nullable().optional(),
        currencyNote: z.string().optional(),
        researchSummary: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.upsert_want_basket(args))
  )

  server.registerTool(
    "upsert_want_product",
    {
      description:
        "Create/update an I-want product. Always include description when known. Auto-creates/links Brand. Pass imageUrls as direct image files (not gallery pages).",
      inputSchema: {
        productId: z.string().optional(),
        name: z.string(),
        brand: z.string(),
        website: z.string().url(),
        originalPrice: z.number().positive(),
        targetPrice: z.number().positive().optional(),
        currentPrice: z.number().positive().optional(),
        model: z.string().optional(),
        sku: z.string().optional(),
        color: z.string().optional(),
        size: z.string().optional(),
        category: z.string().optional(),
        notes: z.string().optional(),
        description: z.string().optional(),
        researchSummary: z.string().optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM).optional(),
        wantBasketId: z.string().nullable().optional(),
        brandId: z.string().nullable().optional(),
        ensureBrand: z.boolean().optional(),
        brandWebsite: z.string().url().optional(),
        specifications: z.record(z.string(), z.string()).optional(),
        imageUrls: z.array(z.string()).optional(),
      },
    },
    async (args) => wrap(() => h.upsert_want_product(args))
  )

  server.registerTool(
    "upsert_brand",
    {
      description: "Create or update a brand profile (e.g. Apple).",
      inputSchema: {
        brandId: z.string().optional(),
        name: z.string(),
        website: z.string().url().optional(),
        notes: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.upsert_brand(args))
  )

  server.registerTool(
    "attach_brand_to_product",
    {
      description: "Link brandId or brandName to a product (creates brand if needed).",
      inputSchema: {
        query: z.string(),
        brandId: z.string().optional(),
        brandName: z.string().optional(),
        createIfMissing: z.boolean().optional(),
        website: z.string().url().optional(),
      },
    },
    async (args) => wrap(() => h.attach_brand_to_product(args))
  )

  server.registerTool(
    "attach_product_images",
    {
      description:
        "Store product photos from direct image URLs (https image file or data:image). Gallery HTML pages will fail — extract each photo URL first.",
      inputSchema: {
        query: z.string(),
        imageUrls: z.array(z.string()).min(1),
        tags: z.array(z.string()).optional(),
      },
    },
    async (args) => wrap(() => h.attach_product_images(args))
  )

  server.registerTool(
    "add_research_visit",
    {
      description: "Log a store visit or online check.",
      inputSchema: {
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        place: z.string(),
        kind: z
          .enum([
            "visited_store",
            "checked_online",
            "tried_on",
            "spoke_to_staff",
            "other",
          ])
          .optional(),
        checkedAt: z.string().optional(),
        whatFound: z.string(),
        url: z.string().url().optional(),
        priceLocal: z.number().optional(),
        currency: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.add_research_visit(args))
  )

  server.registerTool(
    "add_price_benchmark",
    {
      description: "Add a UK/US price benchmark.",
      inputSchema: {
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        itemLabel: z.string(),
        venue: z.string(),
        priceGbp: z.number().nullable().optional(),
        priceLocal: z.number().nullable().optional(),
        currency: z.string().optional(),
        url: z.string().url().optional(),
        specification: z.string().optional(),
        notes: z.string().optional(),
        lastCheckedIso: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.add_price_benchmark(args))
  )

  server.registerTool(
    "add_research_link",
    {
      description: "Attach a research URL.",
      inputSchema: {
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        label: z.string(),
        url: z.string().url(),
        notes: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.add_research_link(args))
  )

  server.registerTool(
    "set_buying_plan_steps",
    {
      description: "Replace buying-plan checklist.",
      inputSchema: {
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        steps: z.array(
          z.object({
            title: z.string(),
            detail: z.string().optional(),
            done: z.boolean().optional(),
            links: z
              .array(z.object({ label: z.string(), url: z.string().url() }))
              .optional(),
          })
        ),
      },
    },
    async (args) => wrap(() => h.set_buying_plan_steps(args))
  )

  server.registerTool(
    "update_buying_stage",
    {
      description: "Set buyingStage on a want product or basket.",
      inputSchema: {
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM),
      },
    },
    async (args) => wrap(() => h.update_buying_stage(args))
  )

  server.registerTool(
    "convert_want_to_have",
    {
      description: "Convert a want product to have after purchase.",
      inputSchema: {
        query: z.string(),
        priceBought: z.number().positive(),
        purchaseLocation: z.string().optional(),
        storeId: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.convert_want_to_have(args))
  )

  server.registerTool(
    "update_have_disposition",
    {
      description: "kept | selling | sold | gifted | recycled.",
      inputSchema: {
        query: z.string(),
        disposition: z.enum(["kept", "selling", "sold", "gifted", "recycled"]),
        soldWhere: z.string().optional(),
        soldAt: z.string().optional(),
      },
    },
    async (args) => wrap(() => h.update_have_disposition(args))
  )

  server.registerTool(
    "append_product_notes",
    {
      description: "Append notes to a want or have product.",
      inputSchema: {
        query: z.string(),
        notes: z.string(),
        type: z.enum(["want", "have", "all"]).optional(),
      },
    },
    async (args) => wrap(() => h.append_product_notes(args))
  )

  return server
}
