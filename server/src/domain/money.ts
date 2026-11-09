import { Decimal } from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export class CurrencyMismatchError extends Error {
  readonly left: string;
  readonly right: string;

  constructor(left: string, right: string) {
    super(`Cannot combine ${left} and ${right}. Totals stay in one currency.`);
    this.name = "CurrencyMismatchError";
    this.left = left;
    this.right = right;
  }
}

export class MissingRateError extends Error {
  readonly currency: string;

  constructor(currency: string) {
    super(`No USD comparison rate is stored for ${currency}.`);
    this.name = "MissingRateError";
    this.currency = currency;
  }
}

export type Money = {
  amount: Decimal;
  currency: string;
};

export function money(amount: Decimal.Value, currency: string): Money {
  return { amount: new Decimal(amount), currency };
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new CurrencyMismatchError(left.currency, right.currency);
  }
  return {
    amount: left.amount.plus(right.amount),
    currency: left.currency,
  };
}

export type RateTable = ReadonlyMap<string, Decimal>;

export function rateTable(
  rates: readonly { currency: string; usdPerUnit: Decimal.Value }[],
): RateTable {
  return new Map(rates.map((rate) => [rate.currency, new Decimal(rate.usdPerUnit)]));
}

export function toUsd(amount: Decimal.Value, currency: string, rates: RateTable): Decimal {
  const value = new Decimal(amount);
  if (currency === "USD") return value.toDecimalPlaces(2);
  const rate = rates.get(currency);
  if (!rate) throw new MissingRateError(currency);
  return value.times(rate).toDecimalPlaces(2);
}

export function median(values: readonly Decimal[]): Decimal | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left.comparedTo(right));
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return sorted[middle - 1].plus(sorted[middle]).div(2).toDecimalPlaces(2);
  }
  return sorted[middle];
}

export function formatAmount(value: Decimal.Value): string {
  return new Decimal(value).toDecimalPlaces(2).toFixed(2);
}
