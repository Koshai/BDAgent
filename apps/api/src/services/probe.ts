import * as cheerio from "cheerio";

export type CommerceKind = "unknown" | "none" | "generic" | "woocommerce" | "shopify" | "magento";

export type CommerceProbe = {
  kind: CommerceKind;
  cartDetected: boolean;
  confidence: number;
  signals: string[];
  seedRoutes: string[];
  notes: string;
};

const FETCH_TIMEOUT_MS = 7000;

async function fetchMeta(url: string): Promise<{ status: number; text: string; json: unknown } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "BDAgentCatalogBot/0.1" },
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, text, json };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function originOf(siteUrl: string): string | null {
  try {
    return new URL(siteUrl).origin;
  } catch {
    return null;
  }
}

function scoreKind(hay: string, jsonHint: boolean): { kind: CommerceKind; signals: string[]; cart: boolean } {
  const signals: string[] = [];
  const h = hay.toLowerCase();

  const woo =
    /woocommerce|wc-ajax|add-to-cart=|wp-content\/plugins\/woocommerce|wc-add-to-cart/.test(h);
  if (woo) signals.push("WooCommerce markup or add-to-cart URLs");

  const shopify = /cdn\.shopify\.com|shopify\.theme|myshopify\.com|\/cart\.js/.test(h);
  if (shopify) signals.push("Shopify assets or cart.js");

  const magento = /mage\/cookies|checkout\/cart|magento|data-mage-init/.test(h);
  if (magento) signals.push("Magento checkout or mage scripts");

  const genericCart =
    /["']\/cart|href=["'][^"']*\/cart|name=["']add-to-cart|class=["'][^"']*add-to-cart|id=["']add-to-cart|ajax_add_to_cart|data-product_id/.test(
      h,
    ) || /"@type"\s*:\s*"product"|itemtype=["'][^"']*schema\.org\/product/i.test(hay);
  if (genericCart) signals.push("Cart or Product schema on page");

  const offers = /"@type"\s*:\s*"(aggregate)?offer"|itemprop=["']price/.test(h);
  if (offers) signals.push("Offer / price markup");

  if (jsonHint) signals.push("Woo REST namespace advertised at /wp-json/");

  if (woo || jsonHint) return { kind: "woocommerce", signals, cart: true };
  if (shopify) return { kind: "shopify", signals, cart: true };
  if (magento) return { kind: "magento", signals, cart: true };
  if (genericCart || offers) return { kind: "generic", signals, cart: genericCart };
  return { kind: "none", signals, cart: false };
}

export async function probeCommerce(siteUrl: string): Promise<CommerceProbe> {
  const origin = originOf(siteUrl);
  if (!origin) {
    return {
      kind: "unknown",
      cartDetected: false,
      confidence: 0,
      signals: [],
      seedRoutes: [],
      notes: "Store URL could not be parsed.",
    };
  }

  const seedRoutes = [
    origin + "/",
    `${origin}/shop/`,
    `${origin}/shop`,
    `${origin}/products`,
    `${origin}/products/`,
    `${origin}/collections`,
    `${origin}/catalog`,
    `${origin}/store`,
    `${origin}/cart`,
    `${origin}/cart/`,
    `${origin}/product-category/`,
  ];

  const home = await fetchMeta(origin + "/");
  if (home?.text) {
    const $ = cheerio.load(home.text);
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const abs = new URL(href, origin).toString().split("#")[0];
        if (new URL(abs).origin !== origin) return;
        if (/\.(jpg|png|gif|pdf|css|js)(\?|$)/i.test(abs)) return;
        seedRoutes.push(abs);
      } catch {
        /* ignore */
      }
    });
  }

  const wpJson = await fetchMeta(`${origin}/wp-json/`);
  let wooRest = false;
  if (wpJson?.json && typeof wpJson.json === "object") {
    const rec = wpJson.json as { namespaces?: string[] };
    wooRest = Boolean(rec.namespaces?.some((n) => n.startsWith("wc/")));
  }

  const pages = await Promise.all(
    [origin + "/", `${origin}/shop`, `${origin}/products`, `${origin}/cart`].map((u) => fetchMeta(u)),
  );
  const hay = [home?.text, ...(pages.filter(Boolean).map((p) => p!.text))]
    .filter(Boolean)
    .map((t) => t!.slice(0, 180_000))
    .join("\n");

  const scored = scoreKind(hay, wooRest);
  let kind = scored.kind;
  if (wooRest && kind === "none") kind = "woocommerce";

  const confidence =
    kind === "woocommerce" || kind === "shopify" ? 0.9 : kind === "generic" ? 0.65 : kind === "none" ? 0.4 : 0.2;

  const notes =
    kind === "woocommerce"
      ? "Looks like WooCommerce. Public crawl can index offers; real cart and order status need REST keys you paste."
      : kind === "shopify"
        ? "Looks like Shopify. Offers can be crawled from public pages. There is no Shopify App Store connect in BDAgent."
        : kind === "magento"
          ? "Looks like Magento. Offers can be crawled from public pages; cart stays on the merchant checkout."
          : kind === "generic"
            ? "Cart or product markup found. Indexing public offers. Native cart only if the platform exposes a same-origin add-to-cart URL (Woo with keys)."
            : "No strong cart signals on the usual paths. Scan still follows homepage and nav links, including custom routes like /bags.";

  return {
    kind,
    cartDetected: scored.cart || wooRest,
    confidence,
    signals: scored.signals,
    seedRoutes: [...new Set(seedRoutes)].slice(0, 40),
    notes,
  };
}
