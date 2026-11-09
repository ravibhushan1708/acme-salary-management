import type { PrismaClient } from "@prisma/client";
import type { Response } from "express";
import { formatAmount } from "../domain/money.js";
import { asyncRoute } from "../http/errors.js";
import { EMPLOYEE_CSV_HEADER, employeeCsvLine } from "./csv.js";

const BATCH = 500;

export function exportEmployees(prisma: PrismaClient) {
  return asyncRoute(async (_req, res) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="employees.csv"');
    writeLine(res, EMPLOYEE_CSV_HEADER);

    let cursor: string | undefined;
    for (;;) {
      const rows = await prisma.employee.findMany({
        orderBy: { employeeNumber: "asc" },
        take: BATCH,
        ...(cursor ? { cursor: { employeeNumber: cursor }, skip: 1 } : {}),
      });
      for (const row of rows) {
        writeLine(
          res,
          employeeCsvLine({
            employeeNumber: row.employeeNumber,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            country: row.country,
            currency: row.currency,
            department: row.department,
            jobTitle: row.jobTitle,
            jobLevel: row.jobLevel,
            annualSalary: formatAmount(row.annualSalary.toString()),
            status: row.status,
          }),
        );
      }
      if (rows.length < BATCH) break;
      cursor = rows[rows.length - 1]?.employeeNumber;
    }
    res.end();
  });
}

function writeLine(res: Response, line: string) {
  res.write(`${line}\n`);
}
