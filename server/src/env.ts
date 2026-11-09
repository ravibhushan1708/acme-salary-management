import { config } from "dotenv";
import { mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const sourceDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(sourceDir, "../..");
const schemaDir = resolve(repoRoot, "prisma");

config({ path: resolve(repoRoot, ".env") });

function sqliteFilePath(url: string): string {
  const raw = url.startsWith("file:") ? url.slice("file:".length) : url;
  if (isAbsolute(raw)) return raw;
  return resolve(schemaDir, raw);
}

const configured = process.env.DATABASE_URL ?? "file:../data/acme.db";
const databasePath = sqliteFilePath(configured);
mkdirSync(dirname(databasePath), { recursive: true });

export const databaseUrl = `file:${databasePath}`;
process.env.DATABASE_URL = databaseUrl;

export const hrEmail = process.env.HR_EMAIL ?? "hr@acme.test";
export const hrPassword = process.env.HR_PASSWORD ?? "acme-hr-demo";
export const port = Number(process.env.PORT ?? 3000);
export const cookieSecure = process.env.COOKIE_SECURE === "true";

export function databasePathFromUrl(url = databaseUrl): string {
  return url.slice("file:".length);
}
