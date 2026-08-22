import { env } from "../env.js";

export function hostnameFromUrl(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function originAllowed(allowedDomains: string[], originHeader: string | undefined, referer?: string): boolean {
  if (env.NODE_ENV === "development") {
    const host = hostnameFromUrl(originHeader || referer || "");
    if (host === "localhost" || host === "127.0.0.1") return true;
  }
  if (!allowedDomains.length) return true;
  const host = hostnameFromUrl(originHeader || "") ?? hostnameFromUrl(referer || "");
  if (!host) return false;
  return allowedDomains.some((domain) => {
    const d = domain.toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
    return host === d || host.endsWith(`.${d}`);
  });
}
