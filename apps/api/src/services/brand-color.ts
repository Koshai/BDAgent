const HEX = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
const RGB = /rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/gi;

const SKIP_NEAR = [
  [255, 255, 255],
  [0, 0, 0],
  [246, 241, 232],
  [20, 34, 28],
] as const;

export function normalizeHex(input: string): string | null {
  let s = input.trim().toLowerCase();
  if (!s.startsWith("#")) s = `#${s}`;
  if (/^#[0-9a-f]{3}$/.test(s)) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  if (!/^#[0-9a-f]{6}$/.test(s)) return null;
  return s;
}

export function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastOn(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#14221c" : "#ffffff";
}

export function softTint(hex: string, amount = 0.85): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#e6f4ee";
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * amount));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === min) return 0;
  const l = (max + min) / 2;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function isBoring(r: number, g: number, b: number): boolean {
  for (const [sr, sg, sb] of SKIP_NEAR) {
    if (Math.abs(r - sr) + Math.abs(g - sg) + Math.abs(b - sb) < 40) return true;
  }
  const sat = saturation(r, g, b);
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return sat < 0.12 || lum > 0.92 || lum < 0.08;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, "0")).join("")}`;
}

function collectFromCss(css: string, scores: Map<string, number>, weight: number) {
  for (const m of css.matchAll(HEX)) {
    const hex = normalizeHex(m[0]);
    if (!hex) continue;
    const rgb = hexToRgb(hex)!;
    if (isBoring(...rgb)) continue;
    const sat = saturation(...rgb);
    scores.set(hex, (scores.get(hex) ?? 0) + weight * (1 + sat));
  }
  for (const m of css.matchAll(RGB)) {
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if ([r, g, b].some((n) => Number.isNaN(n) || n > 255)) continue;
    if (isBoring(r, g, b)) continue;
    const hex = rgbToHex(r, g, b);
    const sat = saturation(r, g, b);
    scores.set(hex, (scores.get(hex) ?? 0) + weight * (1 + sat));
  }
}

function prioritizedMeta(html: string): string | null {
  const patterns = [
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i,
    /<meta[^>]+name=["']msapplication-TileColor["'][^>]+content=["']([^"']+)["']/i,
    /--(?:primary|brand|color-primary|main-color|accent|jade|woo|theme|btn|button)\s*:\s*([^;}+]+)/i,
    /--wp--preset--color--[a-z0-9-]+\s*:\s*(#[0-9a-f]{3,6})/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (!m?.[1]) continue;
    const hex = normalizeHex(m[1].trim());
    if (hex) {
      const rgb = hexToRgb(hex)!;
      if (!isBoring(...rgb)) return hex;
    }
  }
  return null;
}

async function fetchText(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "user-agent": "BDAgentCatalogBot/0.1" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function detectSitePrimaryColor(siteUrl: string): Promise<string | null> {
  const base = new URL(siteUrl);
  const candidates = [base.href, base.origin + "/", base.origin + "/demo/", base.origin + "/demo/woo/"];
  const seen = new Set<string>();

  for (const pageUrl of candidates) {
    if (seen.has(pageUrl)) continue;
    seen.add(pageUrl);
    const html = await fetchText(pageUrl);
    if (!html) continue;

    const meta = prioritizedMeta(html);
    if (meta) return meta;

    const scores = new Map<string, number>();
    collectFromCss(html, scores, 2);

    const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*>/gi;
    const hrefRe = /href=["']([^"']+)["']/i;
    const sheets: string[] = [];
    for (const tag of html.match(linkRe) ?? []) {
      const href = tag.match(hrefRe)?.[1];
      if (!href) continue;
      try {
        const abs = new URL(href, pageUrl).href;
        if (new URL(abs).origin !== base.origin) continue;
        sheets.push(abs);
      } catch {
        /* ignore */
      }
      if (sheets.length >= 3) break;
    }

    for (const sheet of sheets) {
      const css = await fetchText(sheet);
      if (css) collectFromCss(css, scores, 1);
    }

    let best: string | null = null;
    let bestScore = 0;
    for (const [hex, score] of scores) {
      if (score > bestScore) {
        best = hex;
        bestScore = score;
      }
    }
    if (best) return best;
  }

  return null;
}

export const DEFAULT_WIDGET_PRIMARY = "#0b6e4f";
