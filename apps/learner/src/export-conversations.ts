import path from "node:path";
import { prisma } from "./db.js";
import { detectLocaleHint, redactPii } from "./redact.js";
import { appendJsonl, dataPaths, type Checkpoint } from "./store.js";

type TrainingRow = {
  id: string;
  storeId: string;
  conversationId: string;
  locale: "en" | "bn" | "mixed";
  createdAt: string;
  signals: {
    handoff: boolean;
    addToCartNearby: boolean;
    productClickNearby: boolean;
  };
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

function pairMessages(
  messages: Array<{ role: string; content: string; createdAt: Date }>,
): Array<{ user: string; assistant: string }> {
  const pairs: Array<{ user: string; assistant: string }> = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const a = messages[i];
    const b = messages[i + 1];
    if (a.role === "user" && b.role === "assistant") {
      const user = redactPii(a.content);
      const assistant = redactPii(b.content);
      if (user.length >= 2 && assistant.length >= 2) {
        pairs.push({ user, assistant });
      }
    }
  }
  return pairs;
}

export async function exportConversations(cp: Checkpoint): Promise<{
  conversations: number;
  pairs: number;
  newestUpdatedAt: string | null;
}> {
  const since = cp.lastConversationUpdatedAt ? new Date(cp.lastConversationUpdatedAt) : new Date(0);
  const conversations = await prisma.conversation.findMany({
    where: { updatedAt: { gt: since } },
    orderBy: { updatedAt: "asc" },
    take: 100,
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      store: { select: { id: true, name: true, agentTone: true, defaultLocale: true } },
    },
  });

  if (!conversations.length) {
    return { conversations: 0, pairs: 0, newestUpdatedAt: cp.lastConversationUpdatedAt };
  }

  const paths = dataPaths();
  let pairs = 0;
  let newest: string | null = cp.lastConversationUpdatedAt;

  for (const convo of conversations) {
    newest = convo.updatedAt.toISOString();
    const turns = pairMessages(convo.messages);
    if (!turns.length) continue;

    const windowStart = new Date(convo.createdAt.getTime() - 5 * 60_000);
    const windowEnd = new Date(convo.updatedAt.getTime() + 30 * 60_000);
    const nearby = await prisma.event.findMany({
      where: {
        storeId: convo.storeId,
        visitorId: convo.visitorId,
        createdAt: { gte: windowStart, lte: windowEnd },
        type: { in: ["add_to_cart", "product_click", "product_view"] },
      },
      select: { type: true },
      take: 50,
    });

    const signals = {
      handoff: convo.handoff,
      addToCartNearby: nearby.some((e) => e.type === "add_to_cart"),
      productClickNearby: nearby.some((e) => e.type === "product_click" || e.type === "product_view"),
    };

    const rows: TrainingRow[] = turns.map((turn, idx) => {
      const locale = detectLocaleHint(`${turn.user}\n${turn.assistant}`, convo.locale);
      const system = [
        "You are a shopping assistant for one merchant store only.",
        `Store: ${convo.store.name}.`,
        `Reply language preference: ${locale}.`,
        `Tone hint: ${convo.store.agentTone}.`,
        "Stay inside this store's catalog and policies. Never invent prices or stock.",
      ].join(" ");

      return {
        id: `${convo.id}:${idx}`,
        storeId: convo.storeId,
        conversationId: convo.id,
        locale,
        createdAt: convo.updatedAt.toISOString(),
        signals,
        messages: [
          { role: "system", content: system },
          { role: "user", content: turn.user },
          { role: "assistant", content: turn.assistant },
        ],
      };
    });

    const byLocale = {
      en: rows.filter((r) => r.locale === "en"),
      bn: rows.filter((r) => r.locale === "bn"),
      mixed: rows.filter((r) => r.locale === "mixed"),
    };

    await appendJsonl(path.join(paths.datasets, "conversations-en.jsonl"), byLocale.en);
    await appendJsonl(path.join(paths.datasets, "conversations-bn.jsonl"), byLocale.bn);
    await appendJsonl(path.join(paths.datasets, "conversations-mixed.jsonl"), byLocale.mixed);
    await appendJsonl(path.join(paths.datasets, "conversations-all.jsonl"), rows);

    // Fine-tune ready rows (messages only) for future closed models
    await appendJsonl(
      path.join(paths.datasets, "finetune-ready.jsonl"),
      rows.map((r) => ({ messages: r.messages, locale: r.locale, storeId: r.storeId })),
    );

    pairs += rows.length;
  }

  return {
    conversations: conversations.length,
    pairs,
    newestUpdatedAt: newest,
  };
}
