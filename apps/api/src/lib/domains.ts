import { env } from "../env.js";

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Normalize merchant-entered domain values to bare hostnames. */
export function normalizeDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/:\d+$/, "");
}

export function normalizeDomains(domains: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of domains) {
    const d = normalizeDomain(raw);
    if (!d || seen.has(d)) continue;
    seen.add(d);
    out.push(d);
  }
  return out;
}

/**
 * Widget calls must come from an allowlisted host.
 * Empty allowlists are rejected (except localhost in development).
 */
export function originAllowed(
  allowedDomains: string[],
  originHeader: string | undefined,
  referer?: string,
): boolean {
  const host = hostnameFromUrl(originHeader || "") ?? hostnameFromUrl(referer || "");
  if (env.NODE_ENV === "development") {
    if (host === "localhost" || host === "127.0.0.1") return true;
  }
  if (!allowedDomains.length) return false;
  if (!host) return false;
  return allowedDomains.some((domain) => {
    const d = normalizeDomain(domain);
    if (!d) return false;
    return host === d || host.endsWith(`.${d}`);
  });
}
