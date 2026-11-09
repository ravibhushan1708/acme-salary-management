import { Router } from "express";
import type { PrismaClient } from "@prisma/client";
import { Decimal } from "decimal.js";
import { z } from "zod";
import { DEPARTMENTS, JOB_LEVELS } from "../domain/catalog.js";
import { HttpError, asyncRoute } from "../http/errors.js";
import { employeeDto, revisionDto } from "../http/present.js";
import { listEmployees, parseListQuery } from "./list.js";

const departmentValues = [...DEPARTMENTS] as [string, ...string[]];
const levelValues = [...JOB_LEVELS] as [string, ...string[]];

const patchSchema = z
  .object({
    annualSalary: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Enter a salary with up to two decimal places.")
      .optional(),
    department: z.enum(departmentValues).optional(),
    jobTitle: z.string().trim().min(1).max(120).optional(),
    jobLevel: z.enum(levelValues).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Provide a field to update.",
  });

const MAX_SALARY = new Decimal("100000000");

export function employeeRouter(prisma: PrismaClient) {
  const router = Router();

  router.get(
    "/",
    asyncRoute(async (req, res) => {
      const query = parseListQuery(req.query as Record<string, unknown>);
      const result = await listEmployees(prisma, query);
      res.json({
        ...result,
        items: result.items.map(employeeDto),
      });
    }),
  );

  router.get(
    "/:id",
    asyncRoute(async (req, res) => {
      const employee = await prisma.employee.findUnique({
        where: { id: req.params.id },
        include: {
          revisions: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });
      if (!employee) throw new HttpError(404, "Employee not found");
      res.json({
        ...employeeDto(employee),
        revisions: employee.revisions.map(revisionDto),
      });
    }),
  );

  router.patch(
    "/:id",
    asyncRoute(async (req, res) => {
      const input = patchSchema.parse(req.body);
      const existing = await prisma.employee.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new HttpError(404, "Employee not found");

      let nextSalary: Decimal | undefined;
      if (input.annualSalary !== undefined) {
        nextSalary = new Decimal(input.annualSalary).toDecimalPlaces(2);
        if (nextSalary.lte(0) || nextSalary.gt(MAX_SALARY)) {
          throw new HttpError(400, "Invalid salary", "Salary must be greater than zero.", {
            annualSalary: "Salary must be greater than zero and at most 100,000,000.",
          });
        }
      }

      const salaryChanged =
        nextSalary !== undefined && !nextSalary.equals(new Decimal(existing.annualSalary.toString()));

      const updated = await prisma.$transaction(async (tx) => {
        const employee = await tx.employee.update({
          where: { id: existing.id },
          data: {
            annualSalary: nextSalary?.toFixed(2),
            department: input.department,
            jobTitle: input.jobTitle,
            jobLevel: input.jobLevel,
            status: input.status,
          },
        });
        if (salaryChanged && nextSalary) {
          await tx.salaryRevision.create({
            data: {
              employeeId: existing.id,
              previousSalary: existing.annualSalary,
              newSalary: nextSalary.toFixed(2),
              currency: existing.currency,
            },
          });
        }
        return employee;
      });

      res.json(employeeDto(updated));
    }),
  );

  return router;
}
