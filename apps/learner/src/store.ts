import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env.js";

export type Checkpoint = {
  lastConversationUpdatedAt: string | null;
  lastEventCreatedAt: string | null;
  exportedConversations: number;
  exportedPairs: number;
  lastRunAt: string | null;
};

const DEFAULT: Checkpoint = {
  lastConversationUpdatedAt: null,
  lastEventCreatedAt: null,
  exportedConversations: 0,
  exportedPairs: 0,
  lastRunAt: null,
};

export function dataPaths() {
  const root = env.LEARNER_DATA_DIR;
  return {
    root,
    checkpoint: path.join(root, "checkpoint.json"),
    datasets: path.join(root, "datasets"),
    stats: path.join(root, "stats"),
    behavior: path.join(root, "behavior"),
  };
}

export async function ensureDataDirs() {
  const p = dataPaths();
  await mkdir(p.datasets, { recursive: true });
  await mkdir(p.stats, { recursive: true });
  await mkdir(p.behavior, { recursive: true });
}

export async function loadCheckpoint(): Promise<Checkpoint> {
  try {
    const raw = await readFile(dataPaths().checkpoint, "utf8");
    return { ...DEFAULT, ...(JSON.parse(raw) as Checkpoint) };
  } catch {
    return { ...DEFAULT };
  }
}

export async function saveCheckpoint(cp: Checkpoint) {
  await writeFile(dataPaths().checkpoint, JSON.stringify(cp, null, 2), "utf8");
}

export async function appendJsonl(file: string, rows: unknown[]) {
  if (!rows.length) return;
  const body = rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
  await appendFile(file, body, "utf8");
}

export async function writeJson(file: string, value: unknown) {
  await writeFile(file, JSON.stringify(value, null, 2), "utf8");
}
