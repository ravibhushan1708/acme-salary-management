import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { FX_AS_OF, FX_RATES } from "../src/domain/catalog.js";
import { createApp } from "../src/app.js";
import { repoRoot } from "../src/env.js";

export type TestContext = {
  prisma: PrismaClient;
  app: ReturnType<typeof createApp>;
};

export async function createTestContext(): Promise<TestContext> {
  const dir = mkdtempSync(join(tmpdir(), "acme-salary-"));
  const databaseUrl = `file:${join(dir, "test.db")}`;
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "pipe",
  });
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
  await prisma.fxRate.createMany({
    data: FX_RATES.map((rate) => ({
      currency: rate.currency,
      usdPerUnit: rate.usdPerUnit,
      asOf: new Date(`${FX_AS_OF}T00:00:00.000Z`),
    })),
  });
  return { prisma, app: createApp(prisma) };
}

export async function destroyTestContext(context: TestContext) {
  await context.prisma.$disconnect();
}
