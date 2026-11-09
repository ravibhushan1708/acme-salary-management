import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import {
  TEST_EMAIL,
  TEST_PASSWORD,
  createTestContext,
  destroyTestContext,
  type TestContext,
} from "./helpers.js";

let context: TestContext;

beforeAll(async () => {
  context = await createTestContext();
});

afterAll(async () => {
  await destroyTestContext(context);
});

describe("sessions", () => {
  it("rejects salary routes without a session", async () => {
    const response = await request(context.app).get("/api/employees");
    expect(response.status).toBe(401);
    expect(response.body.title).toBe("Sign in required");
  });

  it("rejects a wrong password without revealing the hash", async () => {
    const response = await request(context.app).post("/api/login").send({
      email: TEST_EMAIL,
      password: "wrong-password",
    });
    expect(response.status).toBe(401);
    expect(response.body.title).toBe("Invalid email or password");
    expect(JSON.stringify(response.body)).not.toContain("scrypt");
  });

  it("signs in, returns the HR profile, and signs out", async () => {
    const agent = request.agent(context.app);
    const login = await agent.post("/api/login").send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ email: TEST_EMAIL, name: "Avery Chen" });
    expect(login.headers["set-cookie"]?.[0]).toContain("HttpOnly");

    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(TEST_EMAIL);

    const logout = await agent.post("/api/logout");
    expect(logout.status).toBe(204);

    const after = await agent.get("/api/me");
    expect(after.status).toBe(401);
  });
});
