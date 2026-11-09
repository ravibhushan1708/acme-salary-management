import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail?: string;
  readonly errors?: Record<string, string>;

  constructor(status: number, title: string, detail?: string, errors?: Record<string, string>) {
    super(detail ?? title);
    this.name = "HttpError";
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }
}

export function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      title: error.title,
      detail: error.detail,
      errors: error.errors,
    });
    return;
  }

  if (error instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "request";
      errors[key] = issue.message;
    }
    res.status(400).json({
      title: "Invalid request",
      detail: "Check the highlighted fields.",
      errors,
    });
    return;
  }

  console.error(error instanceof Error ? error.message : "Unknown error");
  res.status(500).json({ title: "Unexpected error" });
}
