/**
 * Normalize Auth.js / API origins.
 * Never assign to `process.env.NEXT_PUBLIC_*` — Next.js inlines those as string
 * literals at build time, which turns `process.env.NEXT_PUBLIC_X = …` into
 * `"https://… " = …` and crashes the production build.
 */
function withOrigin(value: string | undefined, fallbackProtocol = "https"): string | undefined {
  if (!value) return value;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${fallbackProtocol}://${trimmed}`;
}

const authUrl = withOrigin(process.env.AUTH_URL || process.env.NEXTAUTH_URL);
if (authUrl) {
  process.env.AUTH_URL = authUrl;
  process.env.NEXTAUTH_URL = authUrl;
}

const publicApi = withOrigin(process.env.NEXT_PUBLIC_API_URL);
const internalApi = withOrigin(process.env.API_INTERNAL_URL) || publicApi;
if (internalApi) process.env.API_INTERNAL_URL = internalApi;
