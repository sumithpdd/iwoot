import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { listProductsByUser } from "@/lib/server/repositories/products.repository"
import { getProductById } from "@/lib/server/repositories/products.repository"
import {
  getSellCompareBySlug,
  SELL_COMPARE_CATALOG,
} from "@/lib/data/sell-compare-catalog"
import type { HaveProduct, Product } from "@/lib/types/product"
import { getListingPlatforms, getListingStatus } from "@/lib/utils/product-listing"
import { htmlToPlainText } from "@/lib/utils/html-plain-text"

function summarize(p: Product) {
  if (p.type === "have") {
    const h = p as HaveProduct
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      brand: p.brand,
      model: p.model,
      sku: p.sku,
      priceBought: h.priceBought,
      listingStatus: getListingStatus(h),
      listingPlatforms: getListingPlatforms(h),
      condition: h.condition,
    }
  }
  return {
    id: p.id,
    type: p.type,
    name: p.name,
    brand: p.brand,
    model: p.model,
    currentPrice: p.currentPrice,
    targetPrice: p.targetPrice,
  }
}

function textResult(data: unknown, isError = false) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    ...(isError ? { isError: true } : {}),
  }
}

/**
 * MCP tools for Claude / ChatGPT / Cursor over Streamable HTTP.
 * Bound to a single user id resolved from the API key.
 */
export function createIwootMcpServer(uid: string): McpServer {
  const server = new McpServer({
    name: "iwoot",
    version: "0.1.0",
  })

  server.registerTool(
    "list_inventory",
    {
      description: "List IWOOT want/have products for the authenticated user.",
      inputSchema: {
        type: z.enum(["all", "want", "have"]).default("all"),
      },
    },
    async ({ type }) => {
      const products = await listProductsByUser(
        uid,
        type === "all" ? undefined : type
      )
      return textResult({
        count: products.length,
        products: products.map(summarize),
      })
    }
  )

  server.registerTool(
    "get_product",
    {
      description: "Get one product by id (must belong to the user).",
      inputSchema: { productId: z.string() },
    },
    async ({ productId }) => {
      const product = await getProductById(productId)
      if (!product || product.userId !== uid) {
        return textResult({ error: "Not found" }, true)
      }
      return textResult(summarize(product))
    }
  )

  server.registerTool(
    "list_sell_compare_pages",
    {
      description:
        "List static sell-compare pages (Gumtree / CeX / Shpock reference grids).",
    },
    async () =>
      textResult(
        SELL_COMPARE_CATALOG.map((e) => ({
          slug: e.slug,
          path: e.path,
          title: e.title,
        }))
      )
  )

  server.registerTool(
    "get_sell_compare",
    {
      description:
        "Venue price rows for a sell-compare slug (e.g. sonos-move, nebula-cosmos-max).",
      inputSchema: {
        slug: z.enum([
          "sonos-move",
          "nebula-cosmos-max",
          "airpods-pro-2",
          "sonos-move-2",
        ]),
      },
    },
    async ({ slug }) => {
      const entry = getSellCompareBySlug(slug)
      if (!entry) return textResult({ error: "Unknown slug" }, true)
      return textResult({
        title: entry.title,
        path: entry.path,
        venues: entry.rows,
      })
    }
  )

  server.registerTool(
    "draft_listing",
    {
      description:
        "Draft a marketplace listing title/body from a have product (name or id).",
      inputSchema: {
        query: z.string(),
        platform: z
          .enum([
            "Gumtree",
            "Shpock",
            "CeX (we buy)",
            "Facebook Marketplace",
            "eBay",
          ])
          .default("Gumtree"),
      },
    },
    async ({ query, platform }) => {
      const products = await listProductsByUser(uid, "have")
      const q = query.trim().toLowerCase()
      const product =
        products.find((p) => p.id === query.trim()) ||
        products.find((p) =>
          `${p.name} ${p.brand} ${p.model || ""} ${p.sku || ""}`
            .toLowerCase()
            .includes(q)
        )
      if (!product || product.type !== "have") {
        return textResult({ error: "No matching have product" }, true)
      }
      const h = product as HaveProduct
      const condition = h.condition || "Good"
      const title = `${product.brand} ${product.name}${product.model ? ` (${product.model})` : ""} — ${condition}`
      const body = [
        `${product.brand} ${product.name}${product.model ? `, model ${product.model}` : ""}.`,
        `Condition: ${condition}.`,
        `Tracker paid £${h.priceBought.toFixed(2)}. Price for ${platform} — check sell-compare first.`,
        htmlToPlainText(h.description || "").slice(0, 400) || null,
      ]
        .filter(Boolean)
        .join("\n\n")
      return textResult({ productId: product.id, platform, title, body })
    }
  )

  return server
}
