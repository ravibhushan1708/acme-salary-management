import { describe, expect, it } from "vitest";
import { currencyForCountry } from "../domain/catalog.js";
import { EMPLOYEE_COUNT, generateEmployees } from "./generate.js";

describe("generateEmployees", () => {
  const employees = generateEmployees();

  it("builds the same 10,000 people for the default seed", () => {
    expect(employees).toHaveLength(EMPLOYEE_COUNT);
    expect(generateEmployees()).toEqual(employees);
    expect(employees[0]).toEqual({
      employeeNumber: "E00001",
      firstName: "Arjun",
      lastName: "Reid",
      email: "arjun.reid.e00001@acme.test",
      country: "United States",
      currency: "USD",
      department: "Support",
      jobTitle: "Lead, Support",
      jobLevel: "L4",
      annualSalary: "120571.40",
      status: "ACTIVE",
    });
    expect(employees[9999].employeeNumber).toBe("E10000");
    expect(employees[9999].annualSalary).toBe("178700.12");
  });

  it("pairs every country with its currency and stores cents", () => {
    for (const employee of employees) {
      expect(employee.currency).toBe(currencyForCountry(employee.country));
      expect(employee.annualSalary).toMatch(/^\d+\.\d{2}$/);
    }
  });

  it("changes the population when the seed changes", () => {
    expect(generateEmployees(20, 1)[0]).not.toEqual(generateEmployees(20, 2)[0]);
  });
});
