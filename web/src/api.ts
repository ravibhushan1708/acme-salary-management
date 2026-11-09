export type Employee = {
  id: string;
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
  status: "ACTIVE" | "INACTIVE";
  updatedAt: string;
};

export type SalaryRevision = {
  id: string;
  previousSalary: string;
  newSalary: string;
  currency: string;
  createdAt: string;
};

export type EmployeeDetail = Employee & { revisions: SalaryRevision[] };

export type EmployeePage = {
  items: Employee[];
  page: number;
  pageSize: number;
  total: number;
};

export type Insights = {
  fxAsOf: string;
  headcount: number;
  headcountByCountry: { country: string; count: number }[];
  payrollByCurrency: { currency: string; total: string; headcount: number }[];
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

export type CountryExtremes = {
  country: string;
  currency: string;
  highest: PayPerson[];
  lowest: PayPerson[];
};

export type PayPerson = {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  jobLevel: string;
  annualSalary: string;
  currency: string;
};

export type Meta = {
  countries: { country: string; currency: string }[];
  departments: string[];
  jobLevels: string[];
  fxAsOf: string;
  fxRates: { currency: string; usdPerUnit: string }[];
};

export type SessionUser = {
  email: string;
  name: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: Record<string, string>;

  constructor(status: number, title: string, fieldErrors?: Record<string, string>) {
    super(title);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 401 && !path.endsWith("/login")) {
    onUnauthorized();
    throw new ApiError(401, "Sign in required");
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as {
    title?: string;
    errors?: Record<string, string>;
  } | null;

  if (!response.ok) {
    throw new ApiError(response.status, body?.title ?? "Request failed", body?.errors);
  }

  return body as T;
}
