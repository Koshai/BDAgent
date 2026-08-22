import { prisma } from "../db.js";
import { decryptSecret } from "../lib/crypto.js";

export type WooProductDraft = {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  source: "woo";
  inStock: boolean;
  categories: string[];
  externalId: string;
  rawJson?: unknown;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function fetchWooProducts(input: {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
}): Promise<WooProductDraft[]> {
  const origin = new URL(input.siteUrl).origin;
  const products: WooProductDraft[] = [];
  let page = 1;
  const maxPages = 10;

  while (page <= maxPages) {
    const url = new URL("/wp-json/wc/v3/products", origin);
    url.searchParams.set("per_page", "50");
    url.searchParams.set("page", String(page));
    url.searchParams.set("status", "publish");

    const auth = Buffer.from(`${input.consumerKey}:${input.consumerSecret}`).toString("base64");
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, "user-agent": "BDAgent/0.1" },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WooCommerce API ${res.status}: ${body.slice(0, 200)}`);
    }
    const batch = (await res.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const p of batch) {
      const images = (p.images as Array<{ src?: string }> | undefined) ?? [];
      const cats = ((p.categories as Array<{ name?: string }> | undefined) ?? [])
        .map((c) => c.name)
        .filter((n): n is string => Boolean(n));
      products.push({
        title: String(p.name ?? "Untitled"),
        description: stripHtml(String(p.description ?? p.short_description ?? "")).slice(0, 8000),
        price: p.price ? Number(p.price) : null,
        currency: "USD",
        url: String(p.permalink ?? `${origin}/?p=${p.id}`),
        imageUrl: images[0]?.src ?? null,
        source: "woo",
        inStock: p.stock_status !== "outofstock",
        categories: cats,
        externalId: String(p.id),
        rawJson: p,
      });
    }
    if (batch.length < 50) break;
    page += 1;
  }

  return products;
}

export async function lookupWooOrder(
  input: { siteUrl: string; consumerKey: string; consumerSecret: string },
  orderId: string,
  email: string,
) {
  const origin = new URL(input.siteUrl).origin;
  const numeric = orderId.replace(/[^\d]/g, "");
  if (!numeric) return null;
  const auth = Buffer.from(`${input.consumerKey}:${input.consumerSecret}`).toString("base64");
  const res = await fetch(`${origin}/wp-json/wc/v3/orders/${numeric}`, {
    headers: { Authorization: `Basic ${auth}`, "user-agent": "BDAgent/0.1" },
  });
  if (!res.ok) return null;
  const order = (await res.json()) as {
    status?: string;
    total?: string;
    currency?: string;
    date_created?: string;
    number?: string;
    billing?: { email?: string };
  };
  const billed = String(order.billing?.email ?? "").toLowerCase();
  if (billed !== email.toLowerCase()) return null;
  return {
    number: String(order.number ?? numeric),
    status: String(order.status ?? "unknown"),
    total: order.total ? String(order.total) : null,
    currency: order.currency ?? "USD",
    date: order.date_created ?? null,
  };
}

export async function credentialsForStore(storeId: string) {
  const conn = await prisma.wooConnection.findUnique({ where: { storeId } });
  if (!conn) return null;
  return {
    siteUrl: conn.siteUrl,
    consumerKey: decryptSecret(conn.consumerKeyEnc),
    consumerSecret: decryptSecret(conn.consumerSecretEnc),
  };
}
