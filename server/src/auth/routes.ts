import type { PrismaClient } from "@prisma/client";
import type { CookieOptions, Response } from "express";
import { z } from "zod";
import { cookieSecure } from "../env.js";
import { HttpError, asyncRoute } from "../http/errors.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { SESSION_COOKIE, SESSION_MS, hashToken, newSessionToken } from "./sessions.js";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

let dummyHash: string | undefined;

function rejectUnknownPassword(password: string) {
  dummyHash ??= hashPassword("not-a-real-password");
  verifyPassword(password, dummyHash);
}

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure,
    path: "/",
    maxAge: SESSION_MS,
  };
}

export type SignedInUser = {
  id: string;
  email: string;
  name: string;
};

export function requireAuth(prisma: PrismaClient) {
  return asyncRoute(async (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== "string" || token.length < 32) {
      throw new HttpError(401, "Sign in required");
    }

    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      throw new HttpError(401, "Sign in required");
    }

    res.locals.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    } satisfies SignedInUser;
    next();
  });
}

export function currentUser(res: Response): SignedInUser {
  const user = res.locals.user as SignedInUser | undefined;
  if (!user) throw new HttpError(401, "Sign in required");
  return user;
}

export function authRouter(prisma: PrismaClient) {
  return {
    login: asyncRoute(async (req, res) => {
      const input = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({ where: { email: input.email } });
      const valid = user
        ? verifyPassword(input.password, user.passwordHash)
        : (rejectUnknownPassword(input.password), false);
      if (!user || !valid) {
        throw new HttpError(401, "Invalid email or password");
      }

      const token = newSessionToken();
      await prisma.session.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + SESSION_MS),
        },
      });
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
      res.json({ email: user.email, name: user.name });
    }),
    logout: asyncRoute(async (req, res) => {
      const token = req.cookies?.[SESSION_COOKIE];
      if (typeof token === "string") {
        await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
      }
      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        secure: cookieSecure,
        path: "/",
      });
      res.status(204).send();
    }),
    me: asyncRoute(async (_req, res) => {
      res.json(currentUser(res));
    }),
  };
}
