import type { FastifyReply } from "fastify";
import type { Locale } from "@bdagent/shared";
import type { Product, Store } from "@prisma/client";
import { env } from "../env.js";
import { buildAgentSystemPrompt } from "./agent-prompt.js";
import { retrieveProducts, serializeProduct } from "./rag.js";
import { credentialsForStore, lookupWooOrder } from "./woo.js";

function formatMoney(price: number | null, currency: string, locale: Locale): string {
  if (price == null) return locale === "bn" ? "দাম জানতে দোকান দেখুন" : "See store for price";
  try {
    return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
      style: "currency",
      currency,
    }).format(price);
  } catch {
    return `${currency} ${price}`;
  }
}

function fallbackReply(locale: Locale, products: Product[], storeName: string): string {
  if (!products.length) {
    return locale === "bn"
      ? `${storeName}-এ এখনও পণ্য তালিকা সিঙ্ক হয়নি। দয়া করে পরে আবার চেষ্টা করুন।`
      : `${storeName} has no catalog synced yet. Please try again after the merchant syncs products.`;
  }
  const lines = products.slice(0, 4).map((p) => {
    const price = formatMoney(p.price ? Number(p.price) : null, p.currency, locale);
    return `• ${p.title} — ${price}`;
  });
  if (locale === "bn") {
    return `আপনার খোঁজার সাথে মিলিয়ে এই পণ্যগুলো দেখতে পারেন:\n${lines.join("\n")}\nচাইলে সাইজ, বাজেট বা উপলক্ষ বলুন।`;
  }
  return `Here are products that look like a good match:\n${lines.join("\n")}\nTell me a budget, size, or occasion and I can narrow it down.`;
}

function catalogBlock(products: Product[]): string {
  return products
    .map((p, i) => {
      const price = p.price ? `${p.currency} ${p.price}` : "n/a";
      return `[${i + 1}] id=${p.id} title=${p.title} price=${price} url=${p.url} stock=${p.inStock ? "in" : "out"} cats=${p.categories.join(",")} desc=${p.description.slice(0, 800)}`;
    })
    .join("\n");
}

function sse(reply: FastifyReply, obj: unknown) {
  reply.raw.write(`data: ${JSON.stringify(obj)}\n\n`);
}

async function* streamLlmText(input: {
  store: Store;
  locale: Locale;
  message: string;
  pageTitle?: string;
  pageUrl: string;
  products: Product[];
}): AsyncGenerator<string> {
  const system = buildAgentSystemPrompt(input.store, input.locale);

  const user = `Shopper page: ${input.pageTitle || ""} ${input.pageUrl}
Shopper message: ${input.message}

Catalog:
${catalogBlock(input.products)}`;

  const res = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.4,
      stream: true,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`LLM error ${res.status}: ${err.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n");
    buffer = chunks.pop() ?? "";
    for (const line of chunks) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        const piece = json.choices?.[0]?.delta?.content;
        if (piece) yield piece;
      } catch {
        // ignore keep-alives
      }
    }
  }
}

export async function streamChat(
  reply: FastifyReply,
  input: {
    store: Store;
    visitorId: string;
    conversationId: string;
    message: string;
    locale: Locale;
    pageUrl: string;
    pageTitle?: string;
    handoff?: boolean;
  },
) {
  sse(reply, { type: "meta", conversationId: input.conversationId });

  if (input.handoff) {
    const text =
      input.locale === "bn"
        ? "আপনার মেসেজ দোকানে পৌঁছেছে। একজন মানুষ এখানে উত্তর দেবেন।"
        : "Your message reached the store. A person will reply in this chat.";
    sse(reply, { type: "token", text });
    sse(reply, { type: "handoff", active: true });
    sse(reply, { type: "done" });
    return { reply: text, products: [] as ReturnType<typeof serializeProduct>[] };
  }

  const emailMatch = input.message.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i);
  const orderMatch = input.message.match(/(?:order|tracking|অর্ডার|#)\s*[:#-]?\s*(\d{3,})/i);
  if (orderMatch) {
    const creds = await credentialsForStore(input.store.id);
    if (!creds) {
      const text =
        input.locale === "bn"
          ? "অর্ডার স্ট্যাটাস দেখতে দোকানকে WooCommerce কানেক্ট করতে হবে। ইমেইল ও অর্ডার নম্বর দিয়েও চেষ্টা করতে পারেন পরে।"
          : "Order tracking needs WooCommerce connected on this store. Share the order number and the email used at checkout.";
      sse(reply, { type: "token", text });
      sse(reply, { type: "done" });
      return { reply: text, products: [] as ReturnType<typeof serializeProduct>[] };
    }
    if (!emailMatch) {
      const text =
        input.locale === "bn"
          ? `অর্ডার ${orderMatch[1]} খুঁজতে চেকআউটের ইমেইলটা লিখুন।`
          : `To look up order ${orderMatch[1]}, send the email used at checkout.`;
      sse(reply, { type: "token", text });
      sse(reply, { type: "done" });
      return { reply: text, products: [] as ReturnType<typeof serializeProduct>[] };
    }
    const found = await lookupWooOrder(creds, orderMatch[1], emailMatch[0]);
    const text = found
      ? input.locale === "bn"
        ? `অর্ডার #${found.number}: অবস্থা ${found.status}${found.total ? `, মোট ${found.currency} ${found.total}` : ""}.`
        : `Order #${found.number}: status ${found.status}${found.total ? `, total ${found.currency} ${found.total}` : ""}.`
      : input.locale === "bn"
        ? "এই ইমেইল ও অর্ডার নম্বর মিলেনি। নম্বর ও চেকআউট ইমেইল আবার দিন।"
        : "No order matched that number and email. Check both and try again.";
    sse(reply, { type: "token", text });
    sse(reply, { type: "done" });
    return { reply: text, products: [] as ReturnType<typeof serializeProduct>[] };
  }

  const ranked = await retrieveProducts({
    storeId: input.store.id,
    query: input.message,
    pageUrl: input.pageUrl,
    visitorId: input.visitorId,
    limit: 8,
  });

  let full = "";
  if (env.OPENAI_API_KEY && ranked.length) {
    try {
      for await (const piece of streamLlmText({
        store: input.store,
        locale: input.locale,
        message: input.message,
        pageTitle: input.pageTitle,
        pageUrl: input.pageUrl,
        products: ranked,
      })) {
        full += piece;
        sse(reply, { type: "token", text: piece });
      }
    } catch {
      full = "";
    }
  }
  if (!full) {
    const fallback = fallbackReply(input.locale, ranked, input.store.name);
    for (const word of fallback.split(/(?<=\s)/)) {
      full += word;
      sse(reply, { type: "token", text: word });
    }
  }

  const mentioned = ranked.filter((p) => full.toLowerCase().includes(p.title.toLowerCase().slice(0, 10)));
  const picked = (mentioned.length ? mentioned : ranked).slice(0, 3);
  const products = picked.map(serializeProduct);
  sse(reply, { type: "products", products });
  sse(reply, { type: "done" });
  return { reply: full, products };
}
