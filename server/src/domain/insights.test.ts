import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import { FX_RATES } from "./catalog.js";
import { buildInsights, ratesFromCatalog, type SalaryFact } from "./insights.js";
import { addMoney, money } from "./money.js";

const rates = ratesFromCatalog(FX_RATES);

function fact(
  country: string,
  currency: string,
  department: string,
  jobLevel: string,
  annualSalary: string,
): SalaryFact {
  return {
    country,
    currency,
    department,
    jobLevel,
    annualSalary: new Decimal(annualSalary),
  };
}

const fixture: SalaryFact[] = [
  fact("United States", "USD", "Engineering", "L3", "100000.00"),
  fact("United States", "USD", "Engineering", "L3", "50000.00"),
  fact("India", "INR", "Engineering", "L3", "2000000.00"),
  fact("Germany", "EUR", "Sales", "L4", "80000.00"),
];

describe("buildInsights", () => {
  const insights = buildInsights(fixture, rates);

  it("keeps local payroll in separate currencies", () => {
    expect(insights.payrollByCurrency).toEqual([
      { currency: "EUR", total: "80000.00", headcount: 1 },
      { currency: "INR", total: "2000000.00", headcount: 1 },
      { currency: "USD", total: "150000.00", headcount: 2 },
    ]);
    expect(() => addMoney(money("150000", "USD"), money("2000000", "INR"))).toThrow(
      /Cannot combine/,
    );
  });

  it("compares countries in USD using the snapshot", () => {
    expect(insights.headcount).toBe(4);
    expect(insights.headcountByCountry).toEqual([
      { country: "United States", count: 2 },
      { country: "Germany", count: 1 },
      { country: "India", count: 1 },
    ]);
    expect(insights.payrollUsd).toBe("260000.00");
    expect(insights.payrollUsdByCountry).toEqual([
      { country: "United States", currency: "USD", totalUsd: "150000.00", headcount: 2 },
      { country: "Germany", currency: "EUR", totalUsd: "86400.00", headcount: 1 },
      { country: "India", currency: "INR", totalUsd: "23600.00", headcount: 1 },
    ]);
  });

  it("reports median pay by level and department cost in USD", () => {
    expect(insights.medianByLevel).toEqual([
      { jobLevel: "L3", medianUsd: "50000.00", count: 3 },
      { jobLevel: "L4", medianUsd: "86400.00", count: 1 },
    ]);
    expect(insights.departmentTotals).toEqual([
      { department: "Engineering", totalUsd: "173600.00", headcount: 3 },
      { department: "Sales", totalUsd: "86400.00", headcount: 1 },
    ]);
  });
});
