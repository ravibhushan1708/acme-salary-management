import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { Decimal } from "decimal.js";
import { COUNTRIES, DEPARTMENTS, FX_AS_OF, JOB_LEVELS, currencyForCountry } from "../domain/catalog.js";
import { buildInsights, type SalaryFact } from "../domain/insights.js";
import { formatAmount, rateTable } from "../domain/money.js";
import { HttpError, asyncRoute } from "../http/errors.js";
import { salaryString } from "../http/present.js";

export function insightsRouter(prisma: PrismaClient) {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (_req, res) => {
      const [rates, payroll, rows] = await Promise.all([
        prisma.fxRate.findMany(),
        prisma.employee.groupBy({
          by: ["currency"],
          where: { status: "ACTIVE" },
          _sum: { annualSalary: true },
          _count: { _all: true },
        }),
        prisma.employee.findMany({
          where: { status: "ACTIVE" },
          select: {
            country: true,
            currency: true,
            department: true,
            jobLevel: true,
            annualSalary: true,
          },
        }),
      ]);

      const facts: SalaryFact[] = rows.map((row) => ({
        country: row.country,
        currency: row.currency,
        department: row.department,
        jobLevel: row.jobLevel,
        annualSalary: new Decimal(row.annualSalary.toString()),
      }));
      const insights = buildInsights(
        facts,
        rateTable(rates.map((rate) => ({ currency: rate.currency, usdPerUnit: rate.usdPerUnit.toString() }))),
      );
      const asOf = rates[0]?.asOf.toISOString().slice(0, 10) ?? FX_AS_OF;

      res.json({
        fxAsOf: asOf,
        headcount: insights.headcount,
        headcountByCountry: insights.headcountByCountry,
        payrollByCurrency: payroll
          .map((row) => ({
            currency: row.currency,
            total: formatAmount(row._sum.annualSalary?.toString() ?? "0"),
            headcount: row._count._all,
          }))
          .sort((left, right) => left.currency.localeCompare(right.currency)),
        payrollUsd: insights.payrollUsd,
        payrollUsdByCountry: insights.payrollUsdByCountry,
        medianByLevel: insights.medianByLevel,
        departmentTotals: insights.departmentTotals,
      });
    }),
  );

  router.get(
    "/country/:country",
    asyncRoute(async (req, res) => {
      const country = req.params.country;
      const currency = currencyForCountry(country);
      if (!currency) throw new HttpError(404, "Country not found");

      const people = await prisma.employee.findMany({
        where: { country, status: "ACTIVE" },
        orderBy: { annualSalary: "asc" },
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          jobLevel: true,
          annualSalary: true,
          currency: true,
        },
      });

      const present = (employee: (typeof people)[number]) => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        jobTitle: employee.jobTitle,
        jobLevel: employee.jobLevel,
        annualSalary: salaryString(employee.annualSalary),
        currency: employee.currency,
      });

      res.json({
        country,
        currency,
        highest: [...people].reverse().slice(0, 5).map(present),
        lowest: people.slice(0, 5).map(present),
      });
    }),
  );

  return router;
}

export function metaRouter(prisma: PrismaClient) {
  const router = Router();
  router.get(
    "/",
    asyncRoute(async (_req, res) => {
      const rates = await prisma.fxRate.findMany({ orderBy: { currency: "asc" } });
      res.json({
        countries: COUNTRIES.map((entry) => ({
          country: entry.country,
          currency: entry.currency,
        })),
        departments: DEPARTMENTS,
        jobLevels: JOB_LEVELS,
        fxAsOf: rates[0]?.asOf.toISOString().slice(0, 10) ?? FX_AS_OF,
        fxRates: rates.map((rate) => ({
          currency: rate.currency,
          usdPerUnit: rate.usdPerUnit.toString(),
        })),
      });
    }),
  );
  return router;
}
