import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "acme_session";
export const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export function newSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
