import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestContext, destroyTestContext, type TestContext } from "./helpers.js";

let context: TestContext;

beforeAll(async () => {
  context = await createTestContext();
  await context.prisma.employee.createMany({
    data: [
      person("E00001", "Arjun", "Reid", "United States", "USD", "Engineering", "L3", "100000.00"),
      person("E00002", "Mia", "Keller", "United States", "USD", "Engineering", "L3", "50000.00"),
      person("E00003", "Priya", "Sharma", "India", "INR", "Engineering", "L3", "2000000.00"),
      person("E00004", "Jonas", "Berg", "Germany", "EUR", "Sales", "L4", "80000.00"),
      person("E00005", "Idle", "Person", "United States", "USD", "Sales", "L1", "999999.00", "INACTIVE"),
    ],
  });
});

afterAll(async () => {
  await destroyTestContext(context);
});

function person(
  employeeNumber: string,
  firstName: string,
  lastName: string,
  country: string,
  currency: string,
  department: string,
  jobLevel: string,
  annualSalary: string,
  status = "ACTIVE",
) {
  return {
    employeeNumber,
    firstName,
    lastName,
    email: `${firstName}.${lastName}.${employeeNumber}@acme.test`.toLowerCase(),
    country,
    currency,
    department,
    jobTitle: `${jobLevel} ${department}`,
    jobLevel,
    annualSalary,
    status,
  };
}

describe("insights", () => {
  it("matches the hand-worked fixture and ignores inactive pay", async () => {
    const response = await request(context.app).get("/api/insights");
    expect(response.status).toBe(200);
    expect(response.body.fxAsOf).toBe("2026-01-15");
    expect(response.body.headcount).toBe(4);
    expect(response.body.payrollByCurrency).toEqual([
      { currency: "EUR", total: "80000.00", headcount: 1 },
      { currency: "INR", total: "2000000.00", headcount: 1 },
      { currency: "USD", total: "150000.00", headcount: 2 },
    ]);
    expect(response.body.payrollUsd).toBe("260000.00");
    expect(response.body.medianByLevel).toEqual([
      { jobLevel: "L3", medianUsd: "50000.00", count: 3 },
      { jobLevel: "L4", medianUsd: "86400.00", count: 1 },
    ]);
    expect(response.body.departmentTotals).toEqual([
      { department: "Engineering", totalUsd: "173600.00", headcount: 3 },
      { department: "Sales", totalUsd: "86400.00", headcount: 1 },
    ]);
  });

  it("lists the highest and lowest paid people in a country", async () => {
    const response = await request(context.app).get(
      `/api/insights/country/${encodeURIComponent("United States")}`,
    );
    expect(response.status).toBe(200);
    expect(response.body.currency).toBe("USD");
    expect(response.body.highest[0]).toMatchObject({
      employeeNumber: "E00001",
      annualSalary: "100000.00",
    });
    expect(response.body.lowest[0]).toMatchObject({
      employeeNumber: "E00002",
      annualSalary: "50000.00",
    });
    expect(response.body.highest.map((person: { employeeNumber: string }) => person.employeeNumber)).not.toContain(
      "E00005",
    );
  });

  it("returns 404 for a country outside the catalog", async () => {
    const response = await request(context.app).get("/api/insights/country/Narnia");
    expect(response.status).toBe(404);
  });
});
