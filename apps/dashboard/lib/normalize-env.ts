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
if (publicApi) process.env.NEXT_PUBLIC_API_URL = publicApi;

const internalApi = withOrigin(process.env.API_INTERNAL_URL) || publicApi;
if (internalApi) process.env.API_INTERNAL_URL = internalApi;
