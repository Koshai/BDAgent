import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../../.env") });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export const env = {
  API_PORT: Number(process.env.PORT ?? process.env.API_PORT ?? 4000),
  DATABASE_URL: required("DATABASE_URL", "postgresql://bdagent:bdagent@localhost:5432/bdagent"),
  JWT_SECRET: required("JWT_SECRET", "dev-jwt-secret-change-me-please-32ch"),
  ENCRYPTION_KEY: required(
    "ENCRYPTION_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  ),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  OPENAI_MODEL: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
