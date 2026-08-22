import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../db.js";
import { verifyJwt } from "./jwt.js";

export type AuthedUser = { id: string; email: string };

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthedUser;
  }
}

export async function requireUser(req: FastifyRequest, reply: FastifyReply): Promise<AuthedUser | null> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  const payload = verifyJwt(token);
  if (!payload) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    reply.code(401).send({ error: "Unauthorized" });
    return null;
  }
  req.user = { id: user.id, email: user.email };
  return req.user;
}

export function registerAuthDecorator(_app: FastifyInstance) {
  // reserved for future hooks
}
