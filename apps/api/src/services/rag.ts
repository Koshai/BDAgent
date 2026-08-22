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
  if (pageUrl && product.url && pageUrl.startsWith(product.url.split("?")[0])) score += 8;
  if (product.inStock) score += 0.2;
  return score;
}

export async function popularityBoosts(storeId: string): Promise<Map<string, number>> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const grouped = await prisma.event.groupBy({
    by: ["productId", "type"],
    where: {
      storeId,
      productId: { not: null },
      createdAt: { gte: since },
      type: { in: ["product_view", "product_click", "add_to_cart"] },
    },
    _count: { _all: true },
  });
  const map = new Map<string, number>();
  for (const row of grouped) {
    if (!row.productId) continue;
    const weight = row.type === "add_to_cart" ? 5 : row.type === "product_click" ? 3 : 1;
    map.set(row.productId, (map.get(row.productId) ?? 0) + row._count._all * weight);
  }
  return map;
}

export type RankedProduct = Product & { score: number };

export async function retrieveProducts(input: {
  storeId: string;
  query: string;
  pageUrl?: string;
  visitorId?: string;
  limit?: number;
}): Promise<RankedProduct[]> {
  const products = await prisma.product.findMany({
    where: { storeId: input.storeId },
    take: 500,
  });
  if (!products.length) return [];

  const tokens = tokenize(input.query);
  const boosts = await popularityBoosts(input.storeId);

  let visitorBoost = new Set<string>();
  if (input.visitorId) {
    const recent = await prisma.event.findMany({
      where: {
        storeId: input.storeId,
        visitorId: input.visitorId,
        productId: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    visitorBoost = new Set(recent.map((e) => e.productId!).filter(Boolean));
  }

  const ranked = products
    .map((p) => {
      const base = tokens.length ? scoreProduct(p, tokens, input.pageUrl) : 1;
      const pop = Math.log(1 + (boosts.get(p.id) ?? 0));
      const personal = visitorBoost.has(p.id) ? 1.5 : 0;
      return { ...p, score: base + pop + personal };
    })
    .sort((a, b) => b.score - a.score);

  const limit = input.limit ?? 6;
  if (tokens.length) {
    const matched = ranked.filter((p) => p.score > 0.5);
    return (matched.length ? matched : ranked).slice(0, limit);
  }
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
