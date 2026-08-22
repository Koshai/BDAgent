import path from "node:path";
import { prisma } from "./db.js";
import { appendJsonl, dataPaths, type Checkpoint, writeJson } from "./store.js";

export async function exportBehavior(cp: Checkpoint): Promise<{ events: number; newestCreatedAt: string | null }> {
  const since = cp.lastEventCreatedAt ? new Date(cp.lastEventCreatedAt) : new Date(Date.now() - 7 * 24 * 60 * 60_000);
  const events = await prisma.event.findMany({
    where: {
      createdAt: { gt: since },
      type: { in: ["product_view", "product_click", "add_to_cart", "chat_open", "chat_message"] },
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  if (!events.length) {
    return { events: 0, newestCreatedAt: cp.lastEventCreatedAt };
  }

  const paths = dataPaths();
  const rows = events.map((e) => ({
    id: e.id,
    storeId: e.storeId,
    type: e.type,
    productId: e.productId,
    locale: e.locale,
    path: e.path,
    visitorHash: hashVisitor(e.visitorId),
    createdAt: e.createdAt.toISOString(),
  }));

  await appendJsonl(path.join(paths.behavior, "events.jsonl"), rows);

  const affinity = new Map<string, { views: number; clicks: number; carts: number }>();
  for (const e of events) {
    if (!e.productId) continue;
    const key = `${e.storeId}:${e.productId}`;
    const cur = affinity.get(key) ?? { views: 0, clicks: 0, carts: 0 };
    if (e.type === "product_view") cur.views += 1;
    if (e.type === "product_click") cur.clicks += 1;
    if (e.type === "add_to_cart") cur.carts += 1;
    affinity.set(key, cur);
  }

  await appendJsonl(
    path.join(paths.behavior, "product-affinity.jsonl"),
    [...affinity.entries()].map(([key, counts]) => {
      const [storeId, productId] = key.split(":");
      return { storeId, productId, ...counts, at: new Date().toISOString() };
    }),
  );

  return {
    events: events.length,
    newestCreatedAt: events[events.length - 1]!.createdAt.toISOString(),
  };
}

function hashVisitor(visitorId: string): string {
  let h = 0;
  for (let i = 0; i < visitorId.length; i++) h = (h * 31 + visitorId.charCodeAt(i)) >>> 0;
  return `v_${h.toString(16)}`;
}

export async function writeStatsSummary(input: {
  exportedConversations: number;
  exportedPairs: number;
  events: number;
}) {
  const paths = dataPaths();
  const [enLines, bnLines, mixedLines, allLines] = await Promise.all([
    countLines(path.join(paths.datasets, "conversations-en.jsonl")),
    countLines(path.join(paths.datasets, "conversations-bn.jsonl")),
    countLines(path.join(paths.datasets, "conversations-mixed.jsonl")),
    countLines(path.join(paths.datasets, "conversations-all.jsonl")),
  ]);

  await writeJson(path.join(paths.stats, "latest.json"), {
    updatedAt: new Date().toISOString(),
    totals: {
      en: enLines,
      bn: bnLines,
      mixed: mixedLines,
      all: allLines,
      exportedConversations: input.exportedConversations,
      exportedPairs: input.exportedPairs,
    },
    lastBatch: {
      events: input.events,
    },
    note: "Datasets are PII-redacted dialogue pairs for future fine-tuning. Catalog facts stay in RAG, not in these files.",
  });
}

async function countLines(file: string): Promise<number> {
  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(file, "utf8");
    return raw.split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}
