import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, "apps/api/.env") });

export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  LEARNER_INTERVAL_MS: Number(process.env.LEARNER_INTERVAL_MS ?? 120_000),
  LEARNER_DATA_DIR: process.env.LEARNER_DATA_DIR ?? path.join(root, "apps/learner/data"),
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for @bdagent/learner");
}
