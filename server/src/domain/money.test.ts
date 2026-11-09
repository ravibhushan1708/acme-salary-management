import { describe, expect, it } from "vitest";
import { Decimal } from "decimal.js";
import {
  CurrencyMismatchError,
  MissingRateError,
  addMoney,
  formatAmount,
  median,
  money,
  rateTable,
  toUsd,
} from "./money.js";

const rates = rateTable([
  { currency: "USD", usdPerUnit: "1" },
  { currency: "EUR", usdPerUnit: "1.08" },
  { currency: "INR", usdPerUnit: "0.0118" },
]);

describe("addMoney", () => {
  it("adds amounts that share a currency", () => {
    const total = addMoney(money("100.10", "USD"), money("50.05", "USD"));
    expect(total.currency).toBe("USD");
    expect(formatAmount(total.amount)).toBe("150.15");
  });

  it("refuses to add different currencies", () => {
    expect(() => addMoney(money("10", "USD"), money("10", "EUR"))).toThrow(CurrencyMismatchError);
  });
});

describe("toUsd", () => {
  it("rounds a USD amount to cents", () => {
    expect(formatAmount(toUsd("1.005", "USD", rates))).toBe("1.01");
  });

  it("converts with the snapshot rate and rounds half up", () => {
    expect(formatAmount(toUsd("2000000", "INR", rates))).toBe("23600.00");
    expect(formatAmount(toUsd("10.01", "EUR", rates))).toBe("10.81");
  });

  it("fails when the currency has no rate", () => {
    expect(() => toUsd("10", "GBP", rates)).toThrow(MissingRateError);
  });
});

describe("median", () => {
  it("returns the middle value of an odd list", () => {
    const result = median([new Decimal(1), new Decimal(3), new Decimal(2)]);
    expect(result && formatAmount(result)).toBe("2.00");
  });

  it("averages the two middle values of an even list", () => {
    const result = median([
      new Decimal(1),
      new Decimal(2),
      new Decimal(3),
      new Decimal(4),
    ]);
    expect(result && formatAmount(result)).toBe("2.50");
  });

  it("returns null for an empty list", () => {
    expect(median([])).toBeNull();
  });
});
