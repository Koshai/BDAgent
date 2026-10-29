import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });

const WEAK_JWT = new Set([
  "dev-jwt-secret-change-me-please-32ch",
  "change-me-to-a-long-random-string",
]);
const WEAK_ENCRYPTION = new Set([
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
]);

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

function withHttps(value: string | undefined): string | undefined {
  if (!value) return value;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProd = nodeEnv === "production";

const jwtSecret = required("JWT_SECRET", isProd ? undefined : "dev-jwt-secret-change-me-please-32ch");
const encryptionKey = required(
  "ENCRYPTION_KEY",
  isProd ? undefined : "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

if (isProd) {
  if (WEAK_JWT.has(jwtSecret) || jwtSecret.length < 24) {
    throw new Error("JWT_SECRET must be a strong unique secret in production");
  }
  if (WEAK_ENCRYPTION.has(encryptionKey) || !/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters in production");
  }
}

export const env = {
  API_PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  DATABASE_URL: required(
    "DATABASE_URL",
    isProd ? undefined : "postgresql://bdagent:bdagent@127.0.0.1:55432/bdagent",
  ),
  JWT_SECRET: jwtSecret,
  ENCRYPTION_KEY: encryptionKey,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_BASE_URL: withHttps(process.env.OPENAI_BASE_URL) ?? "https://api.openai.com/v1",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  NODE_ENV: nodeEnv,
  PUBLIC_API_URL: withHttps(process.env.API_URL || process.env.PUBLIC_API_URL),
};
