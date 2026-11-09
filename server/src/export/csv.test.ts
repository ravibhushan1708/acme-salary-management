import { describe, expect, it } from "vitest";
import { csvCell, employeeCsvLine } from "./csv.js";

describe("csvCell", () => {
  it("prefixes spreadsheet formulas", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@sum")).toBe("'@sum");
  });

  it("quotes commas and quotes", () => {
    expect(csvCell('Lead, "Support"')).toBe('"Lead, ""Support"""');
  });

  it("leaves ordinary salaries untouched", () => {
    expect(csvCell("120571.40")).toBe("120571.40");
  });
});

describe("employeeCsvLine", () => {
  it("keeps a formula-like name from being executed by a spreadsheet", () => {
    const line = employeeCsvLine({
      employeeNumber: "E00001",
      firstName: "=cmd",
      lastName: "Reid",
      email: "a@acme.test",
      country: "United States",
      currency: "USD",
      department: "Support",
      jobTitle: "Lead, Support",
      jobLevel: "L4",
      annualSalary: "120571.40",
      status: "ACTIVE",
    });
    expect(line).toContain("'=cmd");
    expect(line).toContain('"Lead, Support"');
  });
});
