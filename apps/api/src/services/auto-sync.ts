import { prisma } from "../db.js";
import { syncCatalog } from "./catalog.js";

const AUTO_SYNC_INTERVAL_MS = 30 * 60 * 1000;
let timer: NodeJS.Timeout | null = null;
let running = false;

function dueToday(lastAutoSyncedAt: Date | null, hourUtc: number, now: Date): boolean {
  if (now.getUTCHours() !== hourUtc) return false;
  if (!lastAutoSyncedAt) return true;
  return lastAutoSyncedAt.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);
}

async function runOnce() {
  if (running) return;
  running = true;
  const now = new Date();
  try {
    const stores = await prisma.store.findMany({
      where: { autoSyncDaily: true },
      include: { wooConnection: { select: { id: true } } },
    });

    for (const store of stores) {
      const hour = Math.min(23, Math.max(0, store.autoSyncHourUtc ?? 0));
      if (!dueToday(store.lastAutoSyncedAt, hour, now)) continue;

      const mode = store.wooConnection ? "woo" : "crawl";
      try {
        await syncCatalog(store.id, mode);
        await prisma.store.update({
          where: { id: store.id },
          data: { lastAutoSyncedAt: new Date() },
        });
      } catch {
        // keep loop going; merchant can still run manual sync
      }
    }
  } finally {
    running = false;
  }
}

export function startAutoSyncWorker() {
  if (timer) return;
  void runOnce();
  timer = setInterval(() => {
    void runOnce();
  }, AUTO_SYNC_INTERVAL_MS);
}
