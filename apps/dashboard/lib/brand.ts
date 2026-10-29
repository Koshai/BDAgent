/** Public product brand (user-facing). Package names may still say @bdagent. */
export const BRAND = {
  name: "Dyotona",
  nameBn: "দ্যোতনা",
  domain: "dyotona.com",
  tagline: "An AI clerk that actually knows your catalog.",
  description: "AI shopping agent for ecommerce — English and Bengali",
} as const;

/** Production hosts once DNS is pointed at Railway */
export const PROD_HOSTS = {
  app: "https://dyotona.com",
  www: "https://www.dyotona.com",
  api: "https://api.dyotona.com",
} as const;
