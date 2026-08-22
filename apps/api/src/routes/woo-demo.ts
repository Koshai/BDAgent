import type { FastifyInstance } from "fastify";

export const WOO_DEMO_KEY = "ck_demo_key_local";
export const WOO_DEMO_SECRET = "cs_demo_secret_local";

export const WOO_DEMO_PRODUCTS = [
  {
    id: 101,
    name: "Copper lota",
    slug: "copper-lota",
    permalink: "http://localhost:4000/demo/woo/product-lota.html",
    price: "890",
    regular_price: "890",
    currency: "BDT",
    stock_status: "instock",
    description: "Hand-beaten copper water pot. 1 litre.",
    images: [{ src: "https://images.unsplash.com/photo-1578662996442-48f50103eca2?w=800" }],
    categories: [{ name: "kitchen" }],
  },
  {
    id: 102,
    name: "Mustard oil 1L",
    slug: "mustard-oil",
    permalink: "http://localhost:4000/demo/woo/product-oil.html",
    price: "420",
    regular_price: "420",
    currency: "BDT",
    stock_status: "instock",
    description: "Cold-pressed mustard oil from Bogura.",
    images: [{ src: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800" }],
    categories: [{ name: "pantry" }],
  },
  {
    id: 103,
    name: "Clay kulhar set",
    slug: "clay-kulhar",
    permalink: "http://localhost:4000/demo/woo/product-kulhar.html",
    price: "180",
    regular_price: "180",
    currency: "BDT",
    stock_status: "instock",
    description: "Set of six unglazed tea cups.",
    images: [{ src: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800" }],
    categories: [{ name: "kitchen" }],
  },
];

const DEMO_ORDERS: Record<
  string,
  { status: string; total: string; currency: string; number: string; date_created: string; billing: { email: string } }
> = {
  "1001": {
    status: "processing",
    total: "1310.00",
    currency: "BDT",
    number: "1001",
    date_created: "2026-08-01T10:00:00",
    billing: { email: "shopper@example.com" },
  },
};

function basicOk(header?: string) {
  if (!header?.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const [key, secret] = decoded.split(":");
  return key === WOO_DEMO_KEY && secret === WOO_DEMO_SECRET;
}

function readCart(cookieHeader?: string): string[] {
  const match = cookieHeader?.match(/(?:^|;\s*)bdagent_woo_cart=([^;]+)/);
  if (!match) return [];
  return decodeURIComponent(match[1]).split(",").filter(Boolean);
}

export async function registerWooDemoRoutes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const q = req.query as { "add-to-cart"?: string };
    const add = q["add-to-cart"];
    if (add && /^\d+$/.test(add)) {
      const items = readCart(req.headers.cookie);
      items.push(add);
      reply.header("set-cookie", `bdagent_woo_cart=${encodeURIComponent(items.join(","))}; Path=/; SameSite=Lax`);
      const accept = String(req.headers.accept ?? "");
      if (accept.includes("text/html")) {
        return reply.redirect("/demo/woo/cart.html");
      }
      return reply.code(204).send();
    }
    return reply.redirect("/demo/");
  });

  app.get("/shop", async (_req, reply) => reply.redirect("/demo/woo/"));
  app.get("/shop/", async (_req, reply) => reply.redirect("/demo/woo/"));
  app.get("/cart", async (_req, reply) => reply.redirect("/demo/woo/cart.html"));
  app.get("/cart/", async (_req, reply) => reply.redirect("/demo/woo/cart.html"));

  app.get("/wp-json", async () => ({
    name: "Ghor Mart (Woo demo)",
    namespaces: ["oembed/1.0", "wc/v3", "wp/v2"],
  }));
  app.get("/wp-json/", async () => ({
    name: "Ghor Mart (Woo demo)",
    namespaces: ["oembed/1.0", "wc/v3", "wp/v2"],
  }));

  app.get("/wp-json/wc/v3/products", async (req, reply) => {
    if (!basicOk(req.headers.authorization)) {
      return reply.code(401).send({ code: "woocommerce_rest_cannot_view", message: "Unauthorized" });
    }
    return WOO_DEMO_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      permalink: p.permalink,
      price: p.price,
      regular_price: p.regular_price,
      description: p.description,
      short_description: p.description,
      images: p.images,
      stock_status: p.stock_status,
      categories: p.categories,
    }));
  });

  app.get("/wp-json/wc/v3/orders/:id", async (req, reply) => {
    if (!basicOk(req.headers.authorization)) {
      return reply.code(401).send({ code: "woocommerce_rest_cannot_view", message: "Unauthorized" });
    }
    const { id } = req.params as { id: string };
    const order = DEMO_ORDERS[id];
    if (!order) return reply.code(404).send({ message: "Invalid ID" });
    return order;
  });
}
