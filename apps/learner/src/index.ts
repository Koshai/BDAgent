import { env } from "./env.js";
import { prisma } from "./db.js";
import { exportConversations } from "./export-conversations.js";
import { exportBehavior, writeStatsSummary } from "./export-behavior.js";
import { ensureDataDirs, loadCheckpoint, saveCheckpoint } from "./store.js";

let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const cp = await loadCheckpoint();
    const conv = await exportConversations(cp);
    const beh = await exportBehavior(cp);

    const next = {
      ...cp,
      lastConversationUpdatedAt: conv.newestUpdatedAt,
      lastEventCreatedAt: beh.newestCreatedAt,
      exportedConversations: cp.exportedConversations + conv.conversations,
      exportedPairs: cp.exportedPairs + conv.pairs,
      lastRunAt: new Date().toISOString(),
    };
    await saveCheckpoint(next);
    await writeStatsSummary({
      exportedConversations: next.exportedConversations,
      exportedPairs: next.exportedPairs,
      events: beh.events,
    });

    console.log(
      `[learner] run ok — conversations=${conv.conversations} pairs=${conv.pairs} events=${beh.events} totalPairs=${next.exportedPairs}`,
    );
  } catch (err) {
    console.error("[learner] run failed", err);
  } finally {
    running = false;
  }
}

async function main() {
  await ensureDataDirs();
  console.log(`[learner] watching Postgres every ${env.LEARNER_INTERVAL_MS}ms`);
  console.log(`[learner] data dir: ${env.LEARNER_DATA_DIR}`);
  await tick();
  setInterval(() => {
    void tick();
  }, env.LEARNER_INTERVAL_MS);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
