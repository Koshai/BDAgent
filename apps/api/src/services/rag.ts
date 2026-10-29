import type { Product } from "@prisma/client";
import { prisma } from "../db.js";

function tokenize(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);
}

function scoreProduct(product: Product, tokens: string[], pageUrl?: string): number {
  const hay = `${product.title} ${product.description} ${product.categories.join(" ")}`.toLowerCase();
  let score = 0;
  for (const token of tokens) {
    if (product.title.toLowerCase().includes(token)) score += 4;
    else if (hay.includes(token)) score += 1;
  }
  if (pageUrl && product.url) {
    const clean = product.url.split("?")[0];
    if (pageUrl.startsWith(clean) || clean.includes(pageUrl.split("?")[0].slice(-40))) score += 8;
  }
  if (product.inStock) score += 0.2;
  return score;
}

/** Store-wide popularity from shopper behavior (last 14 days). */
export async function popularityBoosts(storeId: string): Promise<Map<string, number>> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.event.groupBy({
    by: ["productId", "type"],
    where: {
      storeId,
      productId: { not: null },
      createdAt: { gte: since },
      type: { in: ["product_view", "product_click", "add_to_cart", "product_impression"] },
    },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (!row.productId) continue;
    const weight =
      row.type === "add_to_cart"
        ? 6
        : row.type === "product_click"
          ? 3
          : row.type === "product_impression"
            ? 0.5
            : 1;
    map.set(row.productId, (map.get(row.productId) ?? 0) + row._count._all * weight);
  }
  return map;
}

/** This visitor's recent product interest. */
async function visitorAffinity(storeId: string, visitorId: string): Promise<Map<string, number>> {
  const recent = await prisma.event.findMany({
    where: {
      storeId,
      visitorId,
      productId: { not: null },
      type: { in: ["product_view", "product_click", "add_to_cart", "product_impression"] },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  const map = new Map<string, number>();
  for (const e of recent) {
    if (!e.productId) continue;
    const weight =
      e.type === "add_to_cart" ? 4 : e.type === "product_click" ? 2.5 : e.type === "product_view" ? 1.5 : 0.8;
    map.set(e.productId, (map.get(e.productId) ?? 0) + weight);
  }
  return map;
}

export type RankedProduct = Product & { score: number };

export async function retrieveProducts(input: {
  storeId: string;
  query: string;
  pageUrl?: string;
  visitorId?: string;
  /** Extra query text from prior turns — improves RAG without inventing catalog facts */
  contextQuery?: string;
  limit?: number;
}): Promise<RankedProduct[]> {
  const products = await prisma.product.findMany({
    where: { storeId: input.storeId },
    take: 500,
  });
  if (!products.length) return [];

  const combinedQuery = [input.query, input.contextQuery].filter(Boolean).join(" ");
  const tokens = tokenize(combinedQuery);
  const boosts = await popularityBoosts(input.storeId);
  const personal = input.visitorId ? await visitorAffinity(input.storeId, input.visitorId) : new Map<string, number>();

  // Prefer exact URL match first (shopper is already on a product page)
  if (input.pageUrl) {
    const onPage = products.find((p) => input.pageUrl!.startsWith(p.url.split("?")[0]));
    if (onPage && (!tokens.length || scoreProduct(onPage, tokens, input.pageUrl) >= 4)) {
      // keep going — still rank others, but ensure on-page product is boosted via scoreProduct
    }
  }

  const ranked = products
    .map((p) => {
      const base = tokens.length ? scoreProduct(p, tokens, input.pageUrl) : 0.5;
      const pop = Math.log(1 + (boosts.get(p.id) ?? 0));
      const me = Math.log(1 + (personal.get(p.id) ?? 0)) * 1.4;
      return { ...p, score: base + pop + me };
    })
    .sort((a, b) => b.score - a.score);

  const limit = input.limit ?? 6;
  if (tokens.length) {
    const matched = ranked.filter((p) => p.score > 0.5);
    return (matched.length ? matched : ranked).slice(0, limit);
  }
  // No query tokens: still return behavior-ranked catalog slice
  return ranked.slice(0, limit);
}

export function serializeProduct(p: Product) {
  return {
    id: p.id,
    title: p.title,
    description: p.description.slice(0, 280),
    price: p.price ? Number(p.price) : null,
    currency: p.currency,
    url: p.url,
    imageUrl: p.imageUrl,
    inStock: p.inStock,
    externalId: p.externalId,
    source: p.source,
  };
}
