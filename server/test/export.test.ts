import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createTestContext, destroyTestContext, type TestContext } from "./helpers.js";

let context: TestContext;

beforeAll(async () => {
  context = await createTestContext();
  await context.prisma.employee.create({
    data: {
      employeeNumber: "E00001",
      firstName: "=cmd",
      lastName: "Reid",
      email: "arjun.reid.e00001@acme.test",
      country: "United States",
      currency: "USD",
      department: "Support",
      jobTitle: "Lead, Support",
      jobLevel: "L4",
      annualSalary: "120571.40",
      status: "ACTIVE",
    },
  });
});

afterAll(async () => {
  await destroyTestContext(context);
});

describe("CSV export", () => {
  it("requires a session", async () => {
    const response = await request(context.app).get("/api/export/employees.csv");
    expect(response.status).toBe(401);
  });

  it("streams the sheet and neutralizes formula cells", async () => {
    const response = await context.agent.get("/api/export/employees.csv");
    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/csv");
    expect(response.text.split("\n")[0]).toBe(
      "employeeNumber,firstName,lastName,email,country,currency,department,jobTitle,jobLevel,annualSalary,status",
    );
    expect(response.text).toContain("E00001,'=cmd,Reid");
    expect(response.text).toContain('"Lead, Support"');
    expect(response.text).toContain("120571.40");
  });
});
