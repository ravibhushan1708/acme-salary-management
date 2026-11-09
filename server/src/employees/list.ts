import { Prisma, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { DEPARTMENTS, JOB_LEVELS } from "../domain/catalog.js";

const departmentValues = [...DEPARTMENTS] as [string, ...string[]];
const levelValues = [...JOB_LEVELS] as [string, ...string[]];

export const listQuerySchema = z.object({
  q: z.string().trim().optional(),
  country: z.string().trim().min(1).optional(),
  department: z.enum(departmentValues).optional(),
  jobLevel: z.enum(levelValues).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export type EmployeeListQuery = z.infer<typeof listQuerySchema>;

function queryValue(value: unknown): unknown {
  if (Array.isArray(value)) return value[0];
  if (value === "") return undefined;
  return value;
}

export function parseListQuery(input: Record<string, unknown>): EmployeeListQuery {
  return listQuerySchema.parse({
    q: queryValue(input.q),
    country: queryValue(input.country),
    department: queryValue(input.department),
    jobLevel: queryValue(input.jobLevel),
    status: queryValue(input.status),
    page: queryValue(input.page),
    pageSize: queryValue(input.pageSize),
  });
}

function whereSql(query: EmployeeListQuery): Prisma.Sql {
  const filters: Prisma.Sql[] = [];
  if (query.country) filters.push(Prisma.sql`country = ${query.country}`);
  if (query.department) filters.push(Prisma.sql`department = ${query.department}`);
  if (query.jobLevel) filters.push(Prisma.sql`jobLevel = ${query.jobLevel}`);
  if (query.status) filters.push(Prisma.sql`status = ${query.status}`);

  const term = query.q?.replace(/[%_]/g, "").trim();
  if (term) {
    const pattern = `%${term}%`;
    filters.push(Prisma.sql`(
      firstName LIKE ${pattern} COLLATE NOCASE
      OR lastName LIKE ${pattern} COLLATE NOCASE
      OR email LIKE ${pattern} COLLATE NOCASE
      OR employeeNumber LIKE ${pattern} COLLATE NOCASE
    )`);
  }

  if (filters.length === 0) return Prisma.sql`1 = 1`;
  return Prisma.join(filters, " AND ");
}

export async function listEmployees(prisma: PrismaClient, query: EmployeeListQuery) {
  const where = whereSql(query);
  const offset = (query.page - 1) * query.pageSize;
  const [idRows, countRows] = await Promise.all([
    prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM Employee
      WHERE ${where}
      ORDER BY employeeNumber ASC
      LIMIT ${query.pageSize} OFFSET ${offset}
    `,
    prisma.$queryRaw<{ count: number | bigint }[]>`
      SELECT COUNT(*) AS count FROM Employee
      WHERE ${where}
    `,
  ]);

  const ids = idRows.map((row) => row.id);
  const employees = ids.length
    ? await prisma.employee.findMany({ where: { id: { in: ids } } })
    : [];
  const byId = new Map(employees.map((employee) => [employee.id, employee]));

  return {
    items: ids.flatMap((id) => {
      const employee = byId.get(id);
      return employee ? [employee] : [];
    }),
    page: query.page,
    pageSize: query.pageSize,
    total: Number(countRows[0]?.count ?? 0),
  };
}
