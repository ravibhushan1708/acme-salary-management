import "../env.js";
import { PrismaClient } from "@prisma/client";
import { FX_AS_OF, FX_RATES } from "../domain/catalog.js";
import { hashPassword } from "../auth/passwords.js";
import { hrEmail, hrPassword } from "../env.js";
import { generateEmployees } from "./generate.js";

const BATCH_SIZE = 500;

async function main() {
  const prisma = new PrismaClient();
  try {
    const ifEmpty = process.env.SEED_IF_EMPTY === "true";
    if (ifEmpty && (await prisma.user.count()) > 0) {
      console.log("Database already has an HR account. Leaving salaries in place.");
      return;
    }

    const employees = generateEmployees();
    const passwordHash = hashPassword(hrPassword);
    await prisma.$transaction(
      async (tx) => {
        await tx.salaryRevision.deleteMany();
        await tx.session.deleteMany();
        await tx.employee.deleteMany();
        await tx.fxRate.deleteMany();
        await tx.user.deleteMany();

        await tx.user.create({
          data: {
            email: hrEmail,
            name: "Avery Chen",
            passwordHash,
          },
        });

        await tx.fxRate.createMany({
          data: FX_RATES.map((rate) => ({
            currency: rate.currency,
            usdPerUnit: rate.usdPerUnit,
            asOf: new Date(`${FX_AS_OF}T00:00:00.000Z`),
          })),
        });

        for (let offset = 0; offset < employees.length; offset += BATCH_SIZE) {
          await tx.employee.createMany({
            data: employees.slice(offset, offset + BATCH_SIZE),
          });
        }
      },
      { timeout: 120_000 },
    );

    const [people, rates] = await Promise.all([
      prisma.employee.count(),
      prisma.fxRate.count(),
    ]);
    console.log(`Seeded ${people} employees and ${rates} FX rates for ${hrEmail}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
