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
      person("E00004", "Jonas", "Keller", "Germany", "EUR", "Sales", "L4", "80000.00"),
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

describe("employees", () => {
  it("returns a page and the total", async () => {
    const response = await request(context.app).get("/api/employees?page=1&pageSize=2");
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(5);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0].employeeNumber).toBe("E00001");
    expect(response.body.items[0].annualSalary).toBe("100000.00");
  });

  it("rejects a page size above 50", async () => {
    const response = await request(context.app).get("/api/employees?pageSize=51");
    expect(response.status).toBe(400);
    expect(response.body.title).toBe("Invalid request");
  });

  it("finds a person without caring about letter case", async () => {
    const response = await request(context.app).get("/api/employees?q=arjun");
    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].lastName).toBe("Reid");
  });

  it("records a revision only when the salary changes", async () => {
    const listed = await request(context.app).get("/api/employees?q=E00001");
    const id = listed.body.items[0].id as string;

    const same = await request(context.app)
      .patch(`/api/employees/${id}`)
      .send({ department: "Product" });
    expect(same.status).toBe(200);
    expect(same.body.department).toBe("Product");
    expect(same.body.annualSalary).toBe("100000.00");

    const changed = await request(context.app)
      .patch(`/api/employees/${id}`)
      .send({ annualSalary: "110000" });
    expect(changed.status).toBe(200);
    expect(changed.body.annualSalary).toBe("110000.00");

    const detail = await request(context.app).get(`/api/employees/${id}`);
    expect(detail.body.revisions).toHaveLength(1);
    expect(detail.body.revisions[0]).toMatchObject({
      previousSalary: "100000.00",
      newSalary: "110000.00",
      currency: "USD",
    });
  });

  it("rejects a zero salary and an unknown employee", async () => {
    const listed = await request(context.app).get("/api/employees?q=E00002");
    const id = listed.body.items[0].id as string;
    const zero = await request(context.app).patch(`/api/employees/${id}`).send({ annualSalary: "0" });
    expect(zero.status).toBe(400);

    const missing = await request(context.app).get("/api/employees/missing");
    expect(missing.status).toBe(404);
    expect(missing.body.title).toBe("Employee not found");
  });
});
