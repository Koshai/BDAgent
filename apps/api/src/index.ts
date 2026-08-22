import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { env } from "./env.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerStoreRoutes } from "./routes/stores.js";
import { registerWidgetRoutes } from "./routes/widget.js";
import { registerCatalogRoutes } from "./routes/catalog.js";
import { registerWooDemoRoutes } from "./routes/woo-demo.js";
import { registerWooRoutes } from "./routes/woo.js";
import { registerAnalyticsRoutes } from "./routes/analytics.js";
import { registerConversationRoutes } from "./routes/conversations.js";
import { startAutoSyncWorker } from "./services/auto-sync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = Fastify({ logger: true, requestTimeout: 180_000, connectionTimeout: 180_000 });

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await registerWooDemoRoutes(app);

  const widgetDir = path.resolve(__dirname, "../../../packages/widget/dist");
  const publicDir = path.resolve(__dirname, "../public");

  await app.register(fastifyStatic, {
    root: publicDir,
    prefix: "/demo/",
  });

  app.get("/widget.js", async (_req, reply) => {
    const file = path.join(widgetDir, "widget.js");
    if (!existsSync(file)) {
      return reply.code(404).send({ error: "Widget bundle missing. Run pnpm --filter @bdagent/widget build" });
    }
    reply.type("application/javascript");
    return reply.send(createReadStream(file));
  });

  app.get("/sitemap.xml", async (_req, reply) => {
    return reply.sendFile("sitemap.xml");
  });

  app.get("/health", async () => ({
    ok: true,
    service: "bdagent-api",
    llm: Boolean(env.OPENAI_API_KEY),
  }));

  await registerAuthRoutes(app);
  await registerStoreRoutes(app);
  await registerWidgetRoutes(app);
  await registerCatalogRoutes(app);
  await registerWooRoutes(app);
  await registerAnalyticsRoutes(app);
  await registerConversationRoutes(app);

  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
  startAutoSyncWorker();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
