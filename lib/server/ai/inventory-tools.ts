import { tool } from "ai"
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

/** Gemini chat tools — thin Zod/AI SDK wrappers over shared handlers. */
export function buildInventoryChatTools(uid: string) {
  const h = createInventoryToolHandlers(uid)

  return {
    list_inventory: tool({
      description:
        "List the signed-in user’s saved want/have products from Firestore. Use before answering ownership or resale questions.",
      inputSchema: z.object({
        type: z.enum(["all", "want", "have"]).default("all"),
      }),
      execute: async (args) => h.list_inventory(args),
    }),

    get_product: tool({
      description: "Fetch one product by Firestore document id (must belong to the user).",
      inputSchema: z.object({ productId: z.string() }),
      execute: async (args) => h.get_product(args),
    }),

    get_sell_compare: tool({
      description:
        "Load UK sell-compare venue rows from Firestore (Gumtree, CeX, Shpock, etc.) for a page slug.",
      inputSchema: z.object({
        slug: z.string().describe("Sell-compare page slug, e.g. sonos-move"),
      }),
      execute: async (args) => h.get_sell_compare(args),
    }),

    list_sell_compare_pages: tool({
      description: "List published sell-compare pages from Firestore.",
      inputSchema: z.object({}),
      execute: async () => h.list_sell_compare_pages(),
    }),

    draft_listing: tool({
      description:
        "Draft a concise Gumtree / Shpock / CeX-oriented listing title and body from a saved have product.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Product name, brand, model, sku, or Firestore id"),
        platform: z.enum(LIVE_LISTING_PLATFORMS).default("Gumtree"),
      }),
      execute: async (args) => h.draft_listing(args),
    }),

    record_live_listing: tool({
      description:
        "Record that the user posted a live marketplace ad (Gumtree, Shpock, …): mark the have product as selling, save the URL/price in notes, and add a “Your live listing” row on the matching sell-compare page.",
      inputSchema: z.object({
        query: z.string(),
        platform: z.enum(LIVE_LISTING_PLATFORMS),
        url: z.string().url(),
        priceGbp: z.number().nonnegative(),
        sellCompareSlug: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        setWebsite: z.boolean().optional(),
      }),
      execute: async (args) => h.record_live_listing(args),
    }),

    update_listing_status: tool({
      description:
        "Set a have product listingStatus to not_listed, selling, or sold (optional soldWhere / soldAt).",
      inputSchema: z.object({
        query: z.string(),
        listingStatus: z.enum(["not_listed", "selling", "sold"]),
        soldWhere: z.string().optional(),
        soldAt: z.string().optional(),
      }),
      execute: async (args) => h.update_listing_status(args),
    }),

    list_want_research: tool({
      description:
        "Overview of want baskets and want products with research/visit/benchmark counts.",
      inputSchema: z.object({}),
      execute: async () => h.list_want_research(),
    }),

    get_want_details: tool({
      description:
        "Full want product or basket including research visits, UK price benchmarks, links, and buying plan steps.",
      inputSchema: z.object({ query: z.string() }),
      execute: async (args) => h.get_want_details(args),
    }),

    upsert_want_basket: tool({
      description:
        "Create or update a multi-item want shopping plan (e.g. iPad + watches + keyboard).",
      inputSchema: z.object({
        basketId: z.string().optional(),
        title: z.string(),
        blurb: z.string().optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM).optional(),
        targetTotalGbp: z.number().nullable().optional(),
        currencyNote: z.string().optional(),
        researchSummary: z.string().optional(),
      }),
      execute: async (args) => h.upsert_want_basket(args),
    }),

    upsert_want_product: tool({
      description:
        "Create or update an “I want” product (specs, target price, basket link, research summary).",
      inputSchema: z.object({
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
        researchSummary: z.string().optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM).optional(),
        wantBasketId: z.string().nullable().optional(),
        specifications: z.record(z.string(), z.string()).optional(),
      }),
      execute: async (args) => h.upsert_want_product(args),
    }),

    add_research_visit: tool({
      description:
        "Log a store visit or online check against a want product or basket.",
      inputSchema: z.object({
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
      }),
      execute: async (args) => h.add_research_visit(args),
    }),

    add_price_benchmark: tool({
      description: "Add a UK/US price benchmark for a want item.",
      inputSchema: z.object({
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
      }),
      execute: async (args) => h.add_price_benchmark(args),
    }),

    add_research_link: tool({
      description: "Attach a research URL to a want product or basket.",
      inputSchema: z.object({
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        label: z.string(),
        url: z.string().url(),
        notes: z.string().optional(),
      }),
      execute: async (args) => h.add_research_link(args),
    }),

    set_buying_plan_steps: tool({
      description: "Replace the buying plan checklist on a want basket or product.",
      inputSchema: z.object({
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
      }),
      execute: async (args) => h.set_buying_plan_steps(args),
    }),

    update_buying_stage: tool({
      description:
        "Set buyingStage: researching | shortlisted | ready_to_buy | ordered | bought | cancelled.",
      inputSchema: z.object({
        query: z.string(),
        target: z.enum(["product", "basket"]).optional(),
        buyingStage: z.enum(BUYING_STAGE_ENUM),
      }),
      execute: async (args) => h.update_buying_stage(args),
    }),

    convert_want_to_have: tool({
      description:
        "Mark a want product as purchased (type → have) with priceBought; keeps research history.",
      inputSchema: z.object({
        query: z.string(),
        priceBought: z.number().positive(),
        purchaseLocation: z.string().optional(),
        storeId: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (args) => h.convert_want_to_have(args),
    }),

    update_have_disposition: tool({
      description:
        "Set end state for a have item: kept | selling | sold | gifted | recycled.",
      inputSchema: z.object({
        query: z.string(),
        disposition: z.enum(["kept", "selling", "sold", "gifted", "recycled"]),
        soldWhere: z.string().optional(),
        soldAt: z.string().optional(),
      }),
      execute: async (args) => h.update_have_disposition(args),
    }),

    append_product_notes: tool({
      description: "Append research or listing notes to a want or have product.",
      inputSchema: z.object({
        query: z.string(),
        notes: z.string(),
        type: z.enum(["want", "have", "all"]).optional(),
      }),
      execute: async (args) => h.append_product_notes(args),
    }),
  }
}
