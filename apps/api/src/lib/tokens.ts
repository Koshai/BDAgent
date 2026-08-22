import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../env.js";

export type TokenType = "widget" | "secret";

export function generateToken(type: TokenType): { raw: string; prefix: string; hash: string } {
  const body = randomBytes(24).toString("base64url");
  const tag = type === "widget" ? "wgt" : "sec";
  const raw = `${tag}_${body}`;
  return { raw, prefix: raw.slice(0, 12), hash: hashToken(raw) };
}

export function hashToken(raw: string): string {
  return createHmac("sha256", env.JWT_SECRET).update(raw).digest("hex");
}

export function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
