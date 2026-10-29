import type { FastifyInstance } from "fastify";
import { storeCreateSchema, storeUpdateSchema } from "@bdagent/shared";
import { prisma } from "../db.js";
import { requireUser } from "../lib/auth.js";
import { generateToken } from "../lib/tokens.js";
import { hostnameFromUrl, normalizeDomains } from "../lib/domains.js";
import { DEFAULT_WIDGET_PRIMARY, detectSitePrimaryColor, normalizeHex } from "../services/brand-color.js";

async function loadStore(userId: string, storeId: string) {
  return prisma.store.findFirst({ where: { id: storeId, userId } });
}

export async function registerStoreRoutes(app: FastifyInstance) {
  app.get("/v1/stores", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const stores = await prisma.store.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { products: true, conversations: true } } },
    });
    return { stores };
  });

  app.post("/v1/stores", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const parsed = storeCreateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const host = hostnameFromUrl(parsed.data.siteUrl);
    const allowedDomains = normalizeDomains(
      parsed.data.allowedDomains.length > 0 ? parsed.data.allowedDomains : host ? [host] : [],
    );
    if (!allowedDomains.length) {
      return reply.code(400).send({ error: "At least one allowed domain is required (from website URL)" });
    }

    const widget = generateToken("widget");
    const secret = generateToken("secret");

    let widgetPrimaryColor = normalizeHex(parsed.data.widgetPrimaryColor) ?? DEFAULT_WIDGET_PRIMARY;
    let widgetColorManual = parsed.data.widgetColorManual;
    if (!widgetColorManual) {
      const detected = await detectSitePrimaryColor(parsed.data.siteUrl);
      if (detected) widgetPrimaryColor = detected;
    }

    const store = await prisma.store.create({
      data: {
        userId: user.id,
        name: parsed.data.name,
        siteUrl: parsed.data.siteUrl,
        defaultLocale: parsed.data.defaultLocale,
        currency: parsed.data.currency,
        allowedDomains,
        policies: parsed.data.policies,
        storeType: parsed.data.storeType,
        commerceKind: parsed.data.storeType === "woocommerce" ? "woocommerce" : "unknown",
        agentTone: parsed.data.agentTone,
        agentLength: parsed.data.agentLength,
        suggestAlternatives: parsed.data.suggestAlternatives,
        askClarifying: parsed.data.askClarifying,
        upsellEnabled: parsed.data.upsellEnabled,
        collectEmail: parsed.data.collectEmail,
        extraInstructions: parsed.data.extraInstructions ?? "",
        autoSyncDaily: parsed.data.autoSyncDaily,
        autoSyncHourUtc: parsed.data.autoSyncHourUtc,
        widgetPrimaryColor,
        widgetColorManual,
        tokens: {
          create: [
            { type: "widget", tokenHash: widget.hash, prefix: widget.prefix },
            { type: "secret", tokenHash: secret.hash, prefix: secret.prefix },
          ],
        },
      },
    });

    return {
      store,
      tokens: {
        widget: widget.raw,
        secret: secret.raw,
      },
    };
  });

  app.get("/v1/stores/:id", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({
      where: { id, userId: user.id },
      include: {
        tokens: { select: { id: true, type: true, prefix: true, createdAt: true } },
        wooConnection: {
          select: { id: true, siteUrl: true, lastSyncedAt: true, createdAt: true },
        },
        _count: { select: { products: true, conversations: true, events: true } },
      },
    });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    return { store };
  });

  app.patch("/v1/stores/:id", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const parsed = storeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const existing = await loadStore(user.id, id);
    if (!existing) return reply.code(404).send({ error: "Store not found" });

    const data = { ...parsed.data } as Record<string, unknown>;
    if (Array.isArray(data.allowedDomains)) {
      const domains = normalizeDomains(data.allowedDomains as string[]);
      if (!domains.length) {
        return reply.code(400).send({ error: "Allowed domains cannot be empty" });
      }
      data.allowedDomains = domains;
    }
    if (typeof data.siteUrl === "string" && !Array.isArray(parsed.data.allowedDomains)) {
      const hostFromSite = hostnameFromUrl(data.siteUrl);
      if (hostFromSite && !existing.allowedDomains.includes(hostFromSite)) {
        data.allowedDomains = normalizeDomains([...existing.allowedDomains, hostFromSite]);
      }
    }
    if (typeof data.widgetPrimaryColor === "string") {
      const hex = normalizeHex(data.widgetPrimaryColor);
      if (!hex) return reply.code(400).send({ error: "Invalid widgetPrimaryColor" });
      data.widgetPrimaryColor = hex;
      if (data.widgetColorManual === undefined) data.widgetColorManual = true;
    }

    const store = await prisma.store.update({
      where: { id },
      data,
    });
    return { store };
  });

  app.post("/v1/stores/:id/widget-color/detect", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const existing = await loadStore(user.id, id);
    if (!existing) return reply.code(404).send({ error: "Store not found" });
    const detected = await detectSitePrimaryColor(existing.siteUrl);
    const color = detected ?? DEFAULT_WIDGET_PRIMARY;
    const store = await prisma.store.update({
      where: { id },
      data: {
        widgetPrimaryColor: color,
        widgetColorManual: false,
      },
    });
    return {
      store,
      detectedColor: color,
      usedFallback: !detected,
    };
  });

  app.post("/v1/stores/:id/tokens/rotate", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const body = (req.body ?? {}) as { type?: string };
    const type = body.type === "secret" ? "secret" : "widget";
    const existing = await loadStore(user.id, id);
    if (!existing) return reply.code(404).send({ error: "Store not found" });
    const generated = generateToken(type);
    await prisma.apiToken.deleteMany({ where: { storeId: id, type } });
    await prisma.apiToken.create({
      data: { storeId: id, type, tokenHash: generated.hash, prefix: generated.prefix },
    });
    return { type, token: generated.raw, prefix: generated.prefix };
  });

  app.get("/v1/stores/:id/products", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const existing = await loadStore(user.id, id);
    if (!existing) return reply.code(404).send({ error: "Store not found" });
    const products = await prisma.product.findMany({
      where: { storeId: id },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    return { products };
  });
}
