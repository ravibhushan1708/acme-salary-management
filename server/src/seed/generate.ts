import { Decimal } from "decimal.js";
import {
  COUNTRIES,
  DEPARTMENTS,
  FX_RATES,
  JOB_LEVELS,
  LEVEL_BASE_USD,
  countryWeight,
  jobTitle,
  levelWeight,
  payFactor,
  type DepartmentName,
  type JobLevel,
} from "../domain/catalog.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export const DEFAULT_SEED = 20261106;
export const EMPLOYEE_COUNT = 10_000;

const FIRST_NAMES = [
  "Ava", "Noah", "Mia", "Liam", "Sofia", "Ethan", "Priya", "Arjun",
  "Elena", "Jonas", "Chloe", "Owen", "Amelia", "Lucas", "Ananya", "Rahul",
  "Isla", "Hugo", "Nora", "Leo", "Fatima", "Omar", "Hannah", "Felix",
  "Mei", "Kenji", "Lucia", "Mateo", "Grace", "Henry", "Zara", "Adam",
  "Ines", "Theo", "Sara", "Daniel", "Leila", "Nico", "Emma", "Jack",
] as const;

const LAST_NAMES = [
  "Sharma", "Patel", "Garcia", "Mueller", "Silva", "Nguyen", "Brown", "Martin",
  "Dubois", "Rossi", "Kim", "Singh", "Anderson", "Costa", "Keller", "Walsh",
  "Sato", "Ibrahim", "Cohen", "Nowak", "Fernandez", "Hughes", "Berg", "Ali",
  "Campbell", "Moreau", "Oliveira", "Schneider", "Reid", "Tanaka", "Khan", "Bennett",
] as const;

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type GeneratedEmployee = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  currency: string;
  department: string;
  jobTitle: string;
  jobLevel: string;
  annualSalary: string;
  status: EmployeeStatus;
};

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends string>(
  rng: () => number,
  items: readonly T[],
  weightOf: (item: T) => number,
): T {
  const total = items.reduce((sum, item) => sum + weightOf(item), 0);
  let cursor = rng() * total;
  for (const item of items) {
    cursor -= weightOf(item);
    if (cursor <= 0) return item;
  }
  return items[items.length - 1];
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  const index = Math.min(items.length - 1, Math.floor(rng() * items.length));
  return items[index];
}

export function generateEmployees(
  count = EMPLOYEE_COUNT,
  seed = DEFAULT_SEED,
): GeneratedEmployee[] {
  const rng = mulberry32(seed);
  const rates = new Map(FX_RATES.map((rate) => [rate.currency, new Decimal(rate.usdPerUnit)]));
  const employees: GeneratedEmployee[] = [];

  for (let index = 0; index < count; index += 1) {
    const place = pickWeighted(
      rng,
      COUNTRIES.map((entry) => entry.country),
      (country) => countryWeight(country),
    );
    const country = COUNTRIES.find((entry) => entry.country === place);
    if (!country) {
      throw new Error(`Unknown country ${place}`);
    }
    const department = pick(rng, DEPARTMENTS);
    const level = pickWeighted(rng, JOB_LEVELS, (entry) => levelWeight(entry));
    const firstName = pick(rng, FIRST_NAMES);
    const lastName = pick(rng, LAST_NAMES);
    const employeeNumber = `E${String(index + 1).padStart(5, "0")}`;
    const factor = payFactor(country.country);
    const rate = rates.get(country.currency);
    if (!factor || !rate) {
      throw new Error(`Missing pay configuration for ${country.country}`);
    }
    const jitter = new Decimal("0.90").plus(new Decimal(rng().toString()).times("0.20"));
    const usd = new Decimal(LEVEL_BASE_USD[level]).times(factor).times(jitter);
    const local = usd.div(rate).toDecimalPlaces(2);
    const status: EmployeeStatus = rng() < 0.03 ? "INACTIVE" : "ACTIVE";

    employees.push({
      employeeNumber,
      firstName,
      lastName,
      email: `${firstName}.${lastName}.${employeeNumber}@acme.test`.toLowerCase(),
      country: country.country,
      currency: country.currency,
      department,
      jobTitle: jobTitle(department, level),
      jobLevel: level,
      annualSalary: local.toFixed(2),
      status,
    });
  }

  return employees;
}

export function isJobLevel(value: string): value is JobLevel {
  return (JOB_LEVELS as readonly string[]).includes(value);
}

export function isDepartment(value: string): value is DepartmentName {
  return (DEPARTMENTS as readonly string[]).includes(value);
}
