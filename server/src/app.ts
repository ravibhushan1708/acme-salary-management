import cookieParser from "cookie-parser";
import express from "express";
import type { PrismaClient } from "@prisma/client";
import { authRouter, requireAuth } from "./auth/routes.js";
import { employeeRouter } from "./employees/routes.js";
import { errorHandler } from "./http/errors.js";
import { insightsRouter, metaRouter } from "./insights/routes.js";

export function createApp(prisma: PrismaClient) {
  const app = express();
  const auth = authRouter(prisma);
  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });
  app.post("/api/login", auth.login);
  app.post("/api/logout", auth.logout);
  app.use("/api", requireAuth(prisma));
  app.get("/api/me", auth.me);
  app.use("/api/meta", metaRouter(prisma));
  app.use("/api/employees", employeeRouter(prisma));
  app.use("/api/insights", insightsRouter(prisma));

  app.use("/api", (_req, res) => {
    res.status(404).json({ title: "Not found" });
  });
  app.use(errorHandler);
  return app;
}
