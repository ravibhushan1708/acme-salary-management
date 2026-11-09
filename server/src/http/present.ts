import type { Employee, SalaryRevision } from "@prisma/client";
import { formatAmount } from "../domain/money.js";

export function salaryString(value: { toString(): string }): string {
  return formatAmount(value.toString());
}

export function employeeDto(employee: Employee) {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    country: employee.country,
    currency: employee.currency,
    department: employee.department,
    jobTitle: employee.jobTitle,
    jobLevel: employee.jobLevel,
    annualSalary: salaryString(employee.annualSalary),
    status: employee.status,
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export function revisionDto(revision: SalaryRevision) {
  return {
    id: revision.id,
    previousSalary: salaryString(revision.previousSalary),
    newSalary: salaryString(revision.newSalary),
    currency: revision.currency,
    createdAt: revision.createdAt.toISOString(),
  };
}
