import type { FastifyInstance } from "fastify";
import { prisma } from "../db.js";
import { requireUser } from "../lib/auth.js";
import { scanStore, syncCatalog } from "../services/catalog.js";

export async function registerCatalogRoutes(app: FastifyInstance) {
  app.post("/v1/stores/:id/catalog/sync", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const body = (req.body ?? {}) as { mode?: string };
    const mode = body.mode === "woo" ? "woo" : "crawl";
    try {
      const result = await syncCatalog(id, mode);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      return reply.code(400).send({ error: message });
    }
  });

  app.post("/v1/stores/:id/scan", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    try {
      const result = await scanStore(id);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Scan failed";
      return reply.code(400).send({ error: message });
    }
  });
}
