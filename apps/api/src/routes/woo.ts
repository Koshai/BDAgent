import type { FastifyInstance } from "fastify";
import { wooConnectSchema } from "@bdagent/shared";
import { prisma } from "../db.js";
import { requireUser } from "../lib/auth.js";
import { encryptSecret } from "../lib/crypto.js";
import { fetchWooProducts } from "../services/woo.js";
import { syncCatalog } from "../services/catalog.js";

export async function registerWooRoutes(app: FastifyInstance) {
  app.get("/v1/stores/:id/woocommerce", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const conn = await prisma.wooConnection.findUnique({
      where: { storeId: id },
      select: { siteUrl: true, lastSyncedAt: true, createdAt: true },
    });
    return { connection: conn };
  });

  app.post("/v1/stores/:id/woocommerce", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const parsed = wooConnectSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    try {
      await fetchWooProducts(parsed.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not reach WooCommerce";
      return reply.code(400).send({ error: message });
    }

    await prisma.wooConnection.upsert({
      where: { storeId: id },
      create: {
        storeId: id,
        siteUrl: parsed.data.siteUrl,
        consumerKeyEnc: encryptSecret(parsed.data.consumerKey),
        consumerSecretEnc: encryptSecret(parsed.data.consumerSecret),
      },
      update: {
        siteUrl: parsed.data.siteUrl,
        consumerKeyEnc: encryptSecret(parsed.data.consumerKey),
        consumerSecretEnc: encryptSecret(parsed.data.consumerSecret),
      },
    });

    const result = await syncCatalog(id, "woo");
    await prisma.store.update({
      where: { id },
      data: { storeType: "woocommerce", commerceKind: "woocommerce", cartDetected: true },
    });
    return { ok: true, ...result };
  });

  app.delete("/v1/stores/:id/woocommerce", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    await prisma.wooConnection.deleteMany({ where: { storeId: id } });
    return { ok: true };
  });
}
