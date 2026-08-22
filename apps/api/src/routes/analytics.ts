import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireUser } from "../lib/auth.js";

export async function registerAnalyticsRoutes(app: FastifyInstance) {
  app.get("/v1/stores/:id/analytics", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [conversations, messages, events, localeGroups, typeGroups, topPages, topProducts, eventRows, convoRows] =
      await Promise.all([
        prisma.conversation.count({ where: { storeId: id, createdAt: { gte: since } } }),
        prisma.message.count({
          where: { conversation: { storeId: id }, createdAt: { gte: since } },
        }),
        prisma.event.count({ where: { storeId: id, createdAt: { gte: since } } }),
        prisma.event.groupBy({
          by: ["locale"],
          where: { storeId: id, createdAt: { gte: since }, locale: { not: null } },
          _count: { _all: true },
        }),
        prisma.event.groupBy({
          by: ["type"],
          where: { storeId: id, createdAt: { gte: since } },
          _count: { _all: true },
        }),
        prisma.event.groupBy({
          by: ["path"],
          where: { storeId: id, createdAt: { gte: since }, path: { not: null } },
          _count: { _all: true },
          orderBy: { _count: { path: "desc" } },
          take: 8,
        }),
        prisma.event.groupBy({
          by: ["productId"],
          where: {
            storeId: id,
            createdAt: { gte: since },
            productId: { not: null },
            type: { in: ["product_view", "product_click", "add_to_cart"] },
          },
          _count: { _all: true },
          orderBy: { _count: { productId: "desc" } },
          take: 8,
        }),
        prisma.event.findMany({
          where: { storeId: id, createdAt: { gte: since } },
          select: { createdAt: true, type: true },
        }),
        prisma.conversation.findMany({
          where: { storeId: id, createdAt: { gte: since } },
          select: { createdAt: true },
        }),
      ]);

    const productIds = topProducts.map((p) => p.productId).filter((id): id is string => Boolean(id));
    const products = productIds.length
      ? await prisma.product.findMany({ where: { id: { in: productIds } } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const counts = Object.fromEntries(typeGroups.map((g) => [g.type, g._count._all]));
    const chatOpened = counts.chat_open ?? 0;
    const productClicks = counts.product_click ?? 0;
    const addToCart = counts.add_to_cart ?? 0;

    const dayKeys: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      dayKeys.push(d.toISOString().slice(0, 10));
    }
    const eventByDay = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    const convoByDay = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    const cartByDay = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    for (const row of eventRows) {
      const k = row.createdAt.toISOString().slice(0, 10);
      if (k in eventByDay) eventByDay[k] += 1;
      if (row.type === "add_to_cart" && k in cartByDay) cartByDay[k] += 1;
    }
    for (const row of convoRows) {
      const k = row.createdAt.toISOString().slice(0, 10);
      if (k in convoByDay) convoByDay[k] += 1;
    }

    return {
      periodDays: 30,
      conversations,
      messages,
      events,
      localeSplit: localeGroups.map((g) => ({ locale: g.locale, count: g._count._all })),
      eventCounts: counts,
      funnel: {
        chatOpened,
        productClicks,
        addToCart,
      },
      series: {
        days: dayKeys,
        events: dayKeys.map((k) => eventByDay[k]),
        conversations: dayKeys.map((k) => convoByDay[k]),
        addToCart: dayKeys.map((k) => cartByDay[k]),
      },
      topPages: topPages.map((p) => ({ path: p.path, count: p._count._all })),
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        count: p._count._all,
        product: p.productId ? productMap.get(p.productId) ?? null : null,
      })),
    };
  });
}
