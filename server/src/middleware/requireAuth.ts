import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/apiError";
import { SESSION_COOKIE_NAME, verifySessionToken } from "../lib/session";
import { PublicUser, Role } from "../types";

/**
 * Reads the session cookie, validates it, loads the corresponding user from
 * the database, and attaches a safe (passwordHash-free) representation to
 * `req.user`. Rejects with 401 if the cookie is missing/invalid/expired, the
 * user no longer exists, or the account has been deactivated.
 *
 * This is the single place authentication is checked -- controllers never
 * check the cookie themselves.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    const userId = verifySessionToken(token);

    if (!userId) {
      throw ApiError.unauthorized();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw ApiError.unauthorized();
    }

    const publicUser: PublicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    req.user = publicUser;
    next();
  } catch (err) {
    next(err);
  }
}
