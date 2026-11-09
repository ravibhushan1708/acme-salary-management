import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { hashPassword } from "../src/auth/passwords.js";
import { FX_AS_OF, FX_RATES } from "../src/domain/catalog.js";
import { createApp } from "../src/app.js";
import { repoRoot } from "../src/env.js";

export const TEST_EMAIL = "hr@acme.test";
export const TEST_PASSWORD = "acme-hr-demo";

export type TestContext = {
  prisma: PrismaClient;
  app: ReturnType<typeof createApp>;
  agent: ReturnType<typeof request.agent>;
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
  await prisma.user.create({
    data: {
      email: TEST_EMAIL,
      name: "Avery Chen",
      passwordHash: hashPassword(TEST_PASSWORD),
    },
  });
  const app = createApp(prisma);
  const agent = request.agent(app);
  const login = await agent.post("/api/login").send({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (login.status !== 200) {
    throw new Error(`Test login failed: ${login.status}`);
  }
  return { prisma, app, agent };
}

export async function destroyTestContext(context: TestContext) {
  await context.prisma.$disconnect();
}
