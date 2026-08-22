import * as cheerio from "cheerio";
import { env } from "../env.js";

const FETCH_TIMEOUT_MS = 7000;
const CONTEXT_PATHS = [
  "/",
  "/about",
  "/about/",
  "/about-us",
  "/about-us/",
  "/shipping",
  "/shipping/",
  "/shipping-policy",
  "/delivery",
  "/returns",
  "/returns/",
  "/return-policy",
  "/refund-policy",
  "/faq",
  "/faqs",
  "/contact",
  "/contact-us",
  "/privacy-policy",
  "/terms",
  "/policies",
];

async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "BDAgentCatalogBot/0.1" },
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html") && !type.includes("text")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pageText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, nav, header, footer, form, iframe, svg").remove();
  const main = $("main, article, .entry-content, .page, #content, .woocommerce").first().text() || $("body").text();
  return main.replace(/\s+/g, " ").trim().slice(0, 4000);
}

export async function collectSitePages(siteUrl: string): Promise<Array<{ url: string; text: string }>> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return [];
  }
  const pages: Array<{ url: string; text: string }> = [];
  const seen = new Set<string>();
  for (const path of CONTEXT_PATHS) {
    const url = path === "/" ? (siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`) : `${origin}${path}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const html = await fetchText(url);
    if (!html) continue;
    const text = pageText(html);
    if (text.length < 80) continue;
    pages.push({ url, text });
    if (pages.length >= 8) break;
  }
  return pages;
}

async function summarizeWithLlm(storeName: string, pages: Array<{ url: string; text: string }>): Promise<string | null> {
  if (!env.OPENAI_API_KEY || !pages.length) return null;
  const excerpt = pages.map((p) => `URL: ${p.url}\n${p.text.slice(0, 1800)}`).join("\n\n").slice(0, 12000);
  try {
    const res = await fetch(`${env.OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Summarize this merchant website for a shopping assistant. Output 8–14 short bullet lines covering: what they sell, materials/style, shipping, returns, location, language, and anything a shopper would ask. Use only the text. No marketing fluff.",
          },
          { role: "user", content: `Store: ${storeName}\n\n${excerpt}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return json.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

export async function buildSiteBrief(storeName: string, siteUrl: string): Promise<string> {
  const pages = await collectSitePages(siteUrl);
  const llm = await summarizeWithLlm(storeName, pages);
  if (llm) return llm.slice(0, 4000);
  return pages
    .map((p) => p.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);
}
