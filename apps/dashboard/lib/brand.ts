/** Public product brand (user-facing). Package names may still say @bdagent. */
export const BRAND = {
  name: "Dyotona",
  nameBn: "দ্যোতনা",
  domain: "dyotona.com",
  tagline: "An AI clerk that actually knows your catalog.",
  description:
    "Dyotona is an embeddable AI shopping agent for small stores. Shoppers chat in English or Bengali against your synced catalog.",
} as const;

/** Production hosts once DNS is pointed at Railway */
export const PROD_HOSTS = {
  app: "https://dyotona.com",
  www: "https://www.dyotona.com",
  api: "https://api.dyotona.com",
} as const;
