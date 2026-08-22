import * as cheerio from "cheerio";

export type ProductDraft = {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl: string | null;
  source: "crawl";
  categories: string[];
  externalId?: string;
  rawJson?: unknown;
};

const PRODUCT_HINT =
  /(product|shop|item|p\/|goods|collection|catalog|store|offer|sale|cart|category|categories|woo)/i;
const MAX_PAGES = 64;
const FETCH_TIMEOUT_MS = 7000;
const SKIP_FILE = /\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|css|js|mp4|woff2?|xml)(\?|$)/i;
const SKIP_PATH = /\/(wp-admin|wp-login|xmlrpc)(\/|$)|\/logout|mailto:|tel:|javascript:/i;
const QUERY_KEEP = /^(p|page_id|product_id|add-to-cart|post_type|sku)$/i;
const SHOP_PATHS = [
  "/shop",
  "/shop/",
  "/products",
  "/products/",
  "/collections",
  "/catalog",
  "/store",
  "/cart",
  "/product-category/",
  "/product/",
];

async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "BDAgentCatalogBot/0.1 (+https://bdagent.local)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html") && !type.includes("xml") && !type.includes("text")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function absUrl(href: string, base: string): string | null {
  try {
    const url = new URL(href, base);
    url.hash = "";
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function fromJsonLd(html: string, pageUrl: string): ProductDraft[] {
  const $ = cheerio.load(html);
  const out: ProductDraft[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        collectJsonLdProducts(node, pageUrl, out);
      }
    } catch {
      // ignore broken JSON-LD
    }
  });
  return out;
}

function collectJsonLdProducts(node: unknown, pageUrl: string, out: ProductDraft[]) {
  if (!node || typeof node !== "object") return;
  const rec = node as Record<string, unknown>;
  if (Array.isArray(rec["@graph"])) {
    for (const child of rec["@graph"]) collectJsonLdProducts(child, pageUrl, out);
  }
  if (rec.itemListElement) {
    const items = Array.isArray(rec.itemListElement) ? rec.itemListElement : [rec.itemListElement];
    for (const item of items) collectJsonLdProducts(item, pageUrl, out);
  }
  if (rec.item) collectJsonLdProducts(rec.item, pageUrl, out);
  const type = rec["@type"];
  const types = (Array.isArray(type) ? type : [type]).map((t) => String(t ?? ""));
  const isProduct = types.some((t) => /Product$/i.test(t) || t === "Product");
  const isOffer = types.some((t) => t === "Offer" || t === "AggregateOffer");
  if (!isProduct && !(isOffer && rec.name)) return;
  const offers = rec.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
  const offer = (Array.isArray(offers) ? offers[0] : offers) ?? (isOffer ? rec : undefined);
  const image = rec.image;
  const imageUrl =
    typeof image === "string"
      ? image
      : Array.isArray(image)
        ? String(image[0])
        : image && typeof image === "object" && "url" in image
          ? String((image as { url: string }).url)
          : null;
  out.push({
    title: String(rec.name ?? rec.sku ?? "Untitled offer"),
    description: String(rec.description ?? ""),
    price: parsePrice(offer?.price ?? rec.lowPrice ?? rec.highPrice),
    currency: String(offer?.priceCurrency ?? rec.priceCurrency ?? "USD"),
    url: absUrl(String(rec.url ?? pageUrl), pageUrl) || pageUrl,
    imageUrl,
    source: "crawl",
    categories: rec.category ? [String(rec.category)] : [],
    rawJson: rec,
  });
}

function fromOpenGraph(html: string, pageUrl: string): ProductDraft | null {
  const $ = cheerio.load(html);
  const ogType = $('meta[property="og:type"]').attr("content") ?? "";
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text() ||
    $("title").text();
  if (!title.trim()) return null;
  const price =
    parsePrice($('meta[property="product:price:amount"]').attr("content")) ??
    parsePrice($('meta[property="og:price:amount"]').attr("content"));
  const looksLikeProduct =
    ogType.includes("product") ||
    PRODUCT_HINT.test(pageUrl) ||
    price != null ||
    /add-to-cart|data-product_id|woocommerce/i.test(html);
  if (!looksLikeProduct) return null;
  return {
    title: title.trim(),
    description: (
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      ""
    ).trim(),
    price,
    currency: $('meta[property="product:price:currency"]').attr("content") || "USD",
    url: $('meta[property="og:url"]').attr("content") || pageUrl,
    imageUrl: $('meta[property="og:image"]').attr("content") || null,
    source: "crawl",
    categories: [],
  };
}

function fromMicrodata(html: string, pageUrl: string): ProductDraft[] {
  const $ = cheerio.load(html);
  const out: ProductDraft[] = [];
  $('[itemtype*="schema.org/Product"], [itemtype*="schema.org/Product"]').each((_, el) => {
    const node = $(el);
    const title = node.find('[itemprop="name"]').first().text() || node.find("h1,h2,h3").first().text();
    if (!title.trim()) return;
    const href = node.find('[itemprop="url"]').attr("href") || node.find("a[href]").first().attr("href");
    out.push({
      title: title.trim(),
      description: (node.find('[itemprop="description"]').first().text() || "").trim(),
      price: parsePrice(node.find('[itemprop="price"]').attr("content") || node.find('[itemprop="price"]').text()),
      currency: node.find('[itemprop="priceCurrency"]').attr("content") || "USD",
      url: absUrl(href || pageUrl, pageUrl) || pageUrl,
      imageUrl: node.find('[itemprop="image"]').attr("src") || node.find("img").attr("src") || null,
      source: "crawl",
      categories: [],
    });
  });
  return out;
}

function fromProductBody(html: string, pageUrl: string): ProductDraft | null {
  const $ = cheerio.load(html);
  const productPage =
    /single-product|og:type["']?\s*content=["']product/i.test(html) ||
    $(".product_title, h1.product_title").length > 0;
  if (!productPage) return null;
  const title = (
    $(".product_title, h1.product_title, .product_title").first().text() ||
    $("h1").first().text() ||
    $('meta[property="og:title"]').attr("content") ||
    ""
  ).trim();
  if (title.length < 2) return null;
  const clone = cheerio.load(html);
  clone("script, style, noscript, nav, header, footer, form").remove();
  const chunks = [
    clone(".woocommerce-product-details__short-description").text(),
    clone("#tab-description, .woocommerce-Tabs-panel--description, .product-description").text(),
    clone('[itemprop="description"]').text(),
    clone(".product .summary p, .entry-content p").slice(0, 8).text(),
  ];
  const description = chunks
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 20)
    .join(" ")
    .slice(0, 8000);
  if (description.length < 20) return null;
  const id =
    $("[data-product_id]").first().attr("data-product_id") ||
    html.match(/add-to-cart=(\d+)/)?.[1];
  return {
    title,
    description,
    price:
      parsePrice($('meta[property="product:price:amount"]').attr("content")) ??
      parsePrice($(".price .woocommerce-Price-amount, .price").first().text()),
    currency: /৳|BDT/.test(html) ? "BDT" : $('meta[property="product:price:currency"]').attr("content") || "USD",
    url: pageUrl,
    imageUrl: $('meta[property="og:image"]').attr("content") || $("img.wp-post-image, .product img").first().attr("src") || null,
    source: "crawl",
    categories: [],
    externalId: id || undefined,
  };
}

function fromDomProducts(html: string, pageUrl: string): ProductDraft[] {
  const $ = cheerio.load(html);
  const out: ProductDraft[] = [];
  const cards = $(".product, li.type-product, .product-item, [data-product_id], .woocommerce ul.products li");
  cards.each((_, el) => {
    const node = $(el);
    const id = node.attr("data-product_id") || node.find("[data-product_id]").attr("data-product_id");
    const title = (
      node.find(".woocommerce-loop-product__title, .product-title, h2, h3").first().text() ||
      node.find("a").first().text()
    ).trim();
    if (!title || title.length < 2) return;
    const href = node.find("a[href]").first().attr("href") || pageUrl;
    const url = absUrl(href, pageUrl) || pageUrl;
    out.push({
      title,
      description: "",
      price: parsePrice(node.find(".price, .amount, .woocommerce-Price-amount").first().text()),
      currency: /৳|BDT/.test(node.text()) ? "BDT" : "USD",
      url,
      imageUrl: node.find("img").attr("src") || node.find("img").attr("data-src") || null,
      source: "crawl",
      categories: [],
      externalId: id || undefined,
      rawJson: id ? { externalHint: id } : undefined,
    });
  });
  return out;
}

function productKey(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    const keep = [...u.searchParams.entries()].filter(([k]) => QUERY_KEEP.test(k));
    if (!keep.length) {
      u.search = "";
      return u.toString();
    }
    u.search = "";
    for (const [k, v] of keep) u.searchParams.set(k, v);
    return u.toString();
  } catch {
    return url.split("#")[0];
  }
}

function visitable(url: string, start: string): boolean {
  if (!sameHost(url, start)) return false;
  if (SKIP_FILE.test(url) || SKIP_PATH.test(url)) return false;
  try {
    const path = new URL(url).pathname;
    if (path.includes("/wp-json/")) return false;
  } catch {
    return false;
  }
  return true;
}

function followLink(url: string, depth: number): boolean {
  if (depth <= 1) return true;
  return PRODUCT_HINT.test(url) || /[?&](p|page_id|product_id|add-to-cart|post_type)=/i.test(url);
}

function extractLinks(html: string, base: string): string[] {
  const $ = cheerio.load(html);
  const links: string[] = [];
  $("nav a[href], header a[href], .menu a[href], #menu a[href], a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const abs = absUrl(href, base);
    if (abs) links.push(abs);
  });
  return links;
}

async function sitemapUrls(siteUrl: string): Promise<string[]> {
  const origin = new URL(siteUrl).origin;
  const siteBase = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  const robots = await fetchText(`${origin}/robots.txt`);
  const fromRobots =
    robots
      ?.split("\n")
      .map((l) => l.match(/^\s*sitemap:\s*(\S+)/i)?.[1])
      .filter((u): u is string => Boolean(u)) ?? [];
  const candidates = [
    ...fromRobots,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/wp-sitemap.xml`,
    `${origin}/product-sitemap.xml`,
    `${origin}/sitemap_products_1.xml`,
    `${origin}/wp-sitemap-posts-product-1.xml`,
    new URL("sitemap.xml", siteBase).toString(),
  ];
  const urls: string[] = [];
  for (const sm of candidates) {
    const xml = await fetchText(sm);
    if (!xml) continue;
    const matches = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    urls.push(...matches);
  }
  return [...new Set(urls)].slice(0, 160);
}

function sameHost(a: string, b: string): boolean {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch {
    return false;
  }
}

function dedupe(products: ProductDraft[]): ProductDraft[] {
  const map = new Map<string, ProductDraft>();
  for (const p of products) {
    const key = productKey(p.url);
    const prev = map.get(key);
    if (!prev || p.description.length > prev.description.length || (p.price != null && prev.price == null)) {
      map.set(key, { ...p, url: key });
    }
  }
  return [...map.values()].filter((p) => p.title.length > 1);
}

export type CrawlStats = { pages: number; products: ProductDraft[] };

export async function crawlSite(siteUrl: string): Promise<ProductDraft[]> {
  return (await crawlSiteWithStats(siteUrl)).products;
}

export async function crawlSiteWithStats(siteUrl: string, extraSeeds: string[] = []): Promise<CrawlStats> {
  const start = absUrl(siteUrl, siteUrl);
  if (!start) return { pages: 0, products: [] };
  const origin = new URL(start).origin;
  const found: ProductDraft[] = [];
  const seen = new Set<string>();
  type Q = { url: string; depth: number };
  const queue: Q[] = [
    { url: start, depth: 0 },
    ...SHOP_PATHS.map((p) => ({ url: origin + p, depth: 0 })),
    ...extraSeeds.map((url) => ({ url, depth: 0 })),
    ...(await sitemapUrls(start)).map((url) => ({ url, depth: 0 })),
  ];

  let pages = 0;
  while (queue.length && pages < MAX_PAGES) {
    const batch: Q[] = [];
    while (queue.length && batch.length < 4 && pages + batch.length < MAX_PAGES) {
      const item = queue.shift();
      if (!item || seen.has(item.url) || !visitable(item.url, start)) continue;
      seen.add(item.url);
      batch.push(item);
    }
    if (!batch.length) break;
    const bodies = await Promise.all(batch.map(async (item) => ({ ...item, html: await fetchText(item.url) })));
    for (const { url, html, depth } of bodies) {
      pages += 1;
      if (!html) continue;
      const jsonLd = fromJsonLd(html, url);
      const micro = fromMicrodata(html, url);
      const dom = fromDomProducts(html, url);
      found.push(...jsonLd, ...micro, ...dom);
      const body = fromProductBody(html, url);
      if (body) found.push(body);
      if (!jsonLd.length && !micro.length && !dom.length && !body) {
        const og = fromOpenGraph(html, url);
        if (og) found.push(og);
      }
      const cap = depth <= 1 ? 40 : 18;
      const links = extractLinks(html, url)
        .filter((href) => visitable(href, start) && !seen.has(href) && followLink(href, depth + 1))
        .slice(0, cap);
      queue.push(...links.map((href) => ({ url: href, depth: depth + 1 })));
    }
  }

  return { pages, products: dedupe(found) };
}
