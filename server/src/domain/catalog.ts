export const FX_AS_OF = "2026-01-15";

export const COUNTRIES = [
  { country: "United States", currency: "USD", weight: 28, payFactor: "1" },
  { country: "India", currency: "INR", weight: 24, payFactor: "0.28" },
  { country: "United Kingdom", currency: "GBP", weight: 10, payFactor: "0.90" },
  { country: "Germany", currency: "EUR", weight: 10, payFactor: "0.88" },
  { country: "Canada", currency: "CAD", weight: 8, payFactor: "0.86" },
  { country: "Australia", currency: "AUD", weight: 7, payFactor: "0.92" },
  { country: "Singapore", currency: "SGD", weight: 7, payFactor: "0.95" },
  { country: "Brazil", currency: "BRL", weight: 6, payFactor: "0.42" },
] as const;

export const FX_RATES = [
  { currency: "USD", usdPerUnit: "1" },
  { currency: "GBP", usdPerUnit: "1.27" },
  { currency: "EUR", usdPerUnit: "1.08" },
  { currency: "INR", usdPerUnit: "0.0118" },
  { currency: "SGD", usdPerUnit: "0.75" },
  { currency: "BRL", usdPerUnit: "0.18" },
  { currency: "CAD", usdPerUnit: "0.73" },
  { currency: "AUD", usdPerUnit: "0.66" },
] as const;

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "Finance",
  "People",
  "Operations",
  "Support",
] as const;

export const JOB_LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6"] as const;

export const LEVEL_BASE_USD: Record<(typeof JOB_LEVELS)[number], string> = {
  L1: "48000",
  L2: "68000",
  L3: "92000",
  L4: "125000",
  L5: "160000",
  L6: "210000",
};

const LEVEL_WEIGHTS: Record<(typeof JOB_LEVELS)[number], number> = {
  L1: 15,
  L2: 25,
  L3: 25,
  L4: 18,
  L5: 12,
  L6: 5,
};

const LEVEL_RANK: Record<(typeof JOB_LEVELS)[number], string> = {
  L1: "Associate",
  L2: "Specialist",
  L3: "Senior",
  L4: "Lead",
  L5: "Director",
  L6: "VP",
};

export type CountryName = (typeof COUNTRIES)[number]["country"];
export type CurrencyCode = (typeof FX_RATES)[number]["currency"];
export type DepartmentName = (typeof DEPARTMENTS)[number];
export type JobLevel = (typeof JOB_LEVELS)[number];

export function currencyForCountry(country: string): CurrencyCode | undefined {
  const match = COUNTRIES.find((entry) => entry.country === country);
  return match?.currency;
}

export function jobTitle(department: string, level: string): string {
  const rank = LEVEL_RANK[level as JobLevel] ?? level;
  return `${rank}, ${department}`;
}

export function countryWeight(country: CountryName): number {
  return COUNTRIES.find((entry) => entry.country === country)?.weight ?? 0;
}

export function levelWeight(level: JobLevel): number {
  return LEVEL_WEIGHTS[level];
}

export function payFactor(country: string): string | undefined {
  return COUNTRIES.find((entry) => entry.country === country)?.payFactor;
}
