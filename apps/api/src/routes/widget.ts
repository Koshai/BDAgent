import type { FastifyInstance } from "fastify";
import { chatRequestSchema, orderLookupSchema, widgetCopy, widgetEventSchema } from "@bdagent/shared";
import { prisma } from "../db.js";
import { originAllowed } from "../lib/domains.js";
import { rateLimit } from "../lib/rateLimit.js";
import { hashToken } from "../lib/tokens.js";
import { streamChat } from "../services/chat.js";
import { credentialsForStore, lookupWooOrder } from "../services/woo.js";

async function storeFromWidgetToken(header?: string) {
  const raw = header?.startsWith("Bearer ") ? header.slice(7) : header;
  if (!raw) return null;
  const token = await prisma.apiToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { store: true },
  });
  if (!token || token.type !== "widget") return null;
  return token.store;
}

export async function registerWidgetRoutes(app: FastifyInstance) {
  app.get("/v1/widget/bootstrap", async (req, reply) => {
    const store = await storeFromWidgetToken(req.headers.authorization);
    if (!store) return reply.code(401).send({ error: "Invalid widget token" });
    const origin = req.headers.origin as string | undefined;
    if (!originAllowed(store.allowedDomains, origin, req.headers.referer)) {
      return reply.code(403).send({ error: "Domain not allowed" });
    }
    const products = await prisma.product.findMany({
      where: { storeId: store.id, inStock: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: { title: true },
    });
    const suggestions =
      store.defaultLocale === "bn"
        ? [...products.slice(0, 3).map((p) => p.title), "৳১০০০ এর নিচে", "চা"]
        : [...products.slice(0, 3).map((p) => p.title), "under $50", "gift"];
    return {
      store: {
        id: store.id,
        name: store.name,
        defaultLocale: store.defaultLocale,
        currency: store.currency,
        primaryColor: store.widgetPrimaryColor || "#0b6e4f",
      },
      copy: widgetCopy,
      suggestions: suggestions.filter(Boolean).slice(0, 4),
      hasWoo: Boolean(await prisma.wooConnection.findUnique({ where: { storeId: store.id } })),
    };
  });

  app.post("/v1/widget/events", async (req, reply) => {
    const store = await storeFromWidgetToken(req.headers.authorization);
    if (!store) return reply.code(401).send({ error: "Invalid widget token" });
    if (!originAllowed(store.allowedDomains, req.headers.origin as string | undefined, req.headers.referer)) {
      return reply.code(403).send({ error: "Domain not allowed" });
    }
    const parsed = widgetEventSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    await prisma.event.create({
      data: {
        storeId: store.id,
        type: parsed.data.type,
        path: parsed.data.path,
        productId: parsed.data.productId,
        locale: parsed.data.locale,
        visitorId: parsed.data.visitorId,
        metadata: parsed.data.metadata as object | undefined,
      },
    });
    return { ok: true };
  });

  app.post("/v1/widget/chat", async (req, reply) => {
    const store = await storeFromWidgetToken(req.headers.authorization);
    if (!store) return reply.code(401).send({ error: "Invalid widget token" });
    if (!originAllowed(store.allowedDomains, req.headers.origin as string | undefined, req.headers.referer)) {
      return reply.code(403).send({ error: "Domain not allowed" });
    }
    const ip = req.ip || "unknown";
    if (!rateLimit(`chat:${store.id}:${ip}`, 40, 60_000)) {
      return reply.code(429).send({ error: "Too many messages" });
    }
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    let conversation = parsed.data.conversationId
      ? await prisma.conversation.findFirst({
          where: { id: parsed.data.conversationId, storeId: store.id, visitorId: parsed.data.visitorId },
        })
      : null;
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          storeId: store.id,
          visitorId: parsed.data.visitorId,
          locale: parsed.data.locale,
        },
      });
    }

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: parsed.data.message,
      },
    });
    await prisma.event.create({
      data: {
        storeId: store.id,
        type: "message",
        visitorId: parsed.data.visitorId,
        locale: parsed.data.locale,
        path: parsed.data.page.url,
      },
    });

    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache",
      connection: "keep-alive",
      "access-control-allow-origin": (req.headers.origin as string) || "*",
    });

    try {
      const result = await streamChat(reply, {
        store,
        visitorId: parsed.data.visitorId,
        conversationId: conversation.id,
        message: parsed.data.message,
        locale: parsed.data.locale,
        pageUrl: parsed.data.page.url,
        pageTitle: parsed.data.page.title,
        handoff: conversation.handoff,
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: result.reply,
          products: result.products,
        },
      });
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { locale: parsed.data.locale },
      });

      // Persist RAG impressions so future retrieval learns from what was shown
      for (const p of result.products) {
        await prisma.event.create({
          data: {
            storeId: store.id,
            type: "product_impression",
            productId: p.id,
            visitorId: parsed.data.visitorId,
            locale: parsed.data.locale,
            path: parsed.data.page.url,
            metadata: {
              source: "chat_card",
              retrievedIds: result.retrievedIds ?? [],
            },
          },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Chat failed";
      try {
        reply.raw.write(`data: ${JSON.stringify({ type: "error", text: message.slice(0, 200) })}\n\n`);
        reply.raw.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
      } catch {
        /* socket already closed */
      }
    } finally {
      try {
        reply.raw.end();
      } catch {
        /* ignore */
      }
    }
  });

  app.post("/v1/widget/order-status", async (req, reply) => {
    const store = await storeFromWidgetToken(req.headers.authorization);
    if (!store) return reply.code(401).send({ error: "Invalid widget token" });
    if (!originAllowed(store.allowedDomains, req.headers.origin as string | undefined, req.headers.referer)) {
      return reply.code(403).send({ error: "Domain not allowed" });
    }
    const parsed = orderLookupSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const creds = await credentialsForStore(store.id);
    if (!creds) return reply.code(400).send({ error: "Order lookup is not enabled for this store" });
    const found = await lookupWooOrder(creds, parsed.data.orderId, parsed.data.email);
    if (!found) return { found: false };
    return { found: true, order: found };
  });

  app.get("/v1/widget/messages", async (req, reply) => {
    const store = await storeFromWidgetToken(req.headers.authorization);
    if (!store) return reply.code(401).send({ error: "Invalid widget token" });
    if (!originAllowed(store.allowedDomains, req.headers.origin as string | undefined, req.headers.referer)) {
      return reply.code(403).send({ error: "Domain not allowed" });
    }
    const q = req.query as { conversationId?: string; visitorId?: string; after?: string };
    if (!q.conversationId || !q.visitorId) return reply.code(400).send({ error: "Missing conversation" });
    const conversation = await prisma.conversation.findFirst({
      where: { id: q.conversationId, storeId: store.id, visitorId: q.visitorId },
    });
    if (!conversation) return { messages: [], handoff: false };
    if (!q.after) return { messages: [], handoff: conversation.handoff };
    const afterDate = new Date(q.after);
    if (Number.isNaN(afterDate.getTime())) return { messages: [], handoff: conversation.handoff };
    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        role: "merchant",
        createdAt: { gt: afterDate },
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    return { messages, handoff: conversation.handoff };
  });
}
