/** Public product brand (user-facing). Package names may still say @bdagent. */
export const BRAND = {
  name: "Dyotona",
  nameBn: "দ্যোতনা",
  domain: "dyotona.com",
  tagline: "An AI clerk that actually knows your catalog.",
  description:
    "Dyotona (দ্যোতনা) is an embeddable AI shopping agent for small stores. Shoppers chat in English or Bengali against your synced catalog.",
} as const;

/** "Dyotona · দ্যোতনা" for titles and lockups */
export function brandPair(separator = " · "): string {
  return `${BRAND.name}${separator}${BRAND.nameBn}`;
}

/**
 * Production hosts. Prefer www until apex dyotona.com DNS/TLS is solid —
 * Auth redirects and docs links should not send users to an unresolved apex.
 */
export const PROD_HOSTS = {
  app: "https://www.dyotona.com",
  www: "https://www.dyotona.com",
  apex: "https://dyotona.com",
  api: "https://api.dyotona.com",
} as const;
