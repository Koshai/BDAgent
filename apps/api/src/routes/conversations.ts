import type { FastifyInstance } from "fastify";
import { merchantReplySchema } from "@bdagent/shared";
import { prisma } from "../db.js";
import { requireUser } from "../lib/auth.js";

export async function registerConversationRoutes(app: FastifyInstance) {
  app.get("/v1/stores/:id/conversations", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id } = req.params as { id: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const conversations = await prisma.conversation.findMany({
      where: { storeId: id },
      orderBy: { updatedAt: "desc" },
      take: 80,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
    return { conversations };
  });

  app.get("/v1/stores/:id/conversations/:cid", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id, cid } = req.params as { id: string; cid: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const conversation = await prisma.conversation.findFirst({
      where: { id: cid, storeId: id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return reply.code(404).send({ error: "Not found" });
    return { conversation };
  });

  app.post("/v1/stores/:id/conversations/:cid/reply", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id, cid } = req.params as { id: string; cid: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const parsed = merchantReplySchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const conversation = await prisma.conversation.findFirst({ where: { id: cid, storeId: id } });
    if (!conversation) return reply.code(404).send({ error: "Not found" });
    const message = await prisma.message.create({
      data: {
        conversationId: cid,
        role: "merchant",
        content: parsed.data.content,
      },
    });
    await prisma.conversation.update({
      where: { id: cid },
      data: { handoff: parsed.data.handoff ?? true },
    });
    return { message, handoff: true };
  });

  app.post("/v1/stores/:id/conversations/:cid/handoff", async (req, reply) => {
    const user = await requireUser(req, reply);
    if (!user) return;
    const { id, cid } = req.params as { id: string; cid: string };
    const store = await prisma.store.findFirst({ where: { id, userId: user.id } });
    if (!store) return reply.code(404).send({ error: "Store not found" });
    const body = (req.body ?? {}) as { active?: boolean };
    const conversation = await prisma.conversation.updateMany({
      where: { id: cid, storeId: id },
      data: { handoff: Boolean(body.active) },
    });
    if (!conversation.count) return reply.code(404).send({ error: "Not found" });
    return { handoff: Boolean(body.active) };
  });
}
