export function csvCell(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\n\r]/.test(guarded)) return `"${guarded.replaceAll('"', '""')}"`;
  return guarded;
}

export const EMPLOYEE_CSV_HEADER = [
  "employeeNumber",
  "firstName",
  "lastName",
  "email",
  "country",
  "currency",
  "department",
  "jobTitle",
  "jobLevel",
  "annualSalary",
  "status",
].join(",");

export function employeeCsvLine(employee: {
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
  status: string;
}): string {
  return [
    employee.employeeNumber,
    employee.firstName,
    employee.lastName,
    employee.email,
    employee.country,
    employee.currency,
    employee.department,
    employee.jobTitle,
    employee.jobLevel,
    employee.annualSalary,
    employee.status,
  ]
    .map(csvCell)
    .join(",");
}
