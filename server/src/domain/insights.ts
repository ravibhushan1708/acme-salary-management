import { Decimal } from "decimal.js";
import { addMoney, formatAmount, median, money, rateTable, toUsd, type Money, type RateTable } from "./money.js";

export type SalaryFact = {
  country: string;
  currency: string;
  department: string;
  jobLevel: string;
  annualSalary: Decimal;
};

export type PayrollByCurrency = {
  currency: string;
  total: string;
  headcount: number;
};

export type Insights = {
  headcount: number;
  headcountByCountry: { country: string; count: number }[];
  payrollByCurrency: PayrollByCurrency[];
  payrollUsd: string;
  payrollUsdByCountry: {
    country: string;
    currency: string;
    totalUsd: string;
    headcount: number;
  }[];
  medianByLevel: { jobLevel: string; medianUsd: string; count: number }[];
  departmentTotals: { department: string; totalUsd: string; headcount: number }[];
};

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const groupKey = key(item);
    const existing = groups.get(groupKey);
    if (existing) existing.push(item);
    else groups.set(groupKey, [item]);
  }
  return groups;
}

function sumSameCurrency(amounts: readonly Money[]): Decimal {
  if (amounts.length === 0) return new Decimal(0);
  return amounts.reduce((total, item) => addMoney(total, item)).amount;
}

export function payrollByCurrency(facts: readonly SalaryFact[]): PayrollByCurrency[] {
  const grouped = groupBy(facts, (fact) => fact.currency);
  return [...grouped.entries()]
    .map(([currency, rows]) => ({
      currency,
      total: formatAmount(
        sumSameCurrency(rows.map((row) => money(row.annualSalary, row.currency))),
      ),
      headcount: rows.length,
    }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

function compareMoneyDesc(left: string, right: string): number {
  return new Decimal(right).comparedTo(left);
}

export function buildInsights(facts: readonly SalaryFact[], rates: RateTable): Insights {
  const withUsd = facts.map((fact) => ({
    ...fact,
    usd: toUsd(fact.annualSalary, fact.currency, rates),
  }));

  const headcountByCountry = [...groupBy(facts, (fact) => fact.country).entries()]
    .map(([country, rows]) => ({ country, count: rows.length }))
    .sort((left, right) => right.count - left.count || left.country.localeCompare(right.country));

  const payrollUsdByCountry = [...groupBy(withUsd, (fact) => fact.country).entries()]
    .map(([country, rows]) => ({
      country,
      currency: rows[0].currency,
      totalUsd: formatAmount(rows.reduce((total, row) => total.plus(row.usd), new Decimal(0))),
      headcount: rows.length,
    }))
    .sort(
      (left, right) =>
        compareMoneyDesc(left.totalUsd, right.totalUsd) || left.country.localeCompare(right.country),
    );

  const medianByLevel = [...groupBy(withUsd, (fact) => fact.jobLevel).entries()]
    .map(([jobLevel, rows]) => ({
      jobLevel,
      medianUsd: formatAmount(median(rows.map((row) => row.usd)) ?? 0),
      count: rows.length,
    }))
    .sort((left, right) => left.jobLevel.localeCompare(right.jobLevel, undefined, { numeric: true }));

  const departmentTotals = [...groupBy(withUsd, (fact) => fact.department).entries()]
    .map(([department, rows]) => ({
      department,
      totalUsd: formatAmount(rows.reduce((total, row) => total.plus(row.usd), new Decimal(0))),
      headcount: rows.length,
    }))
    .sort(
      (left, right) =>
        compareMoneyDesc(left.totalUsd, right.totalUsd) ||
        left.department.localeCompare(right.department),
    );

  const payrollUsd = formatAmount(
    withUsd.reduce((total, row) => total.plus(row.usd), new Decimal(0)),
  );

  return {
    headcount: facts.length,
    headcountByCountry,
    payrollByCurrency: payrollByCurrency(facts),
    payrollUsd,
    payrollUsdByCountry,
    medianByLevel,
    departmentTotals,
  };
}

export function ratesFromCatalog(
  rates: readonly { currency: string; usdPerUnit: string }[],
): RateTable {
  return rateTable(rates);
}
