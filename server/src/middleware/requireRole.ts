import { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError";
import { Role } from "../types";

/**
 * RBAC middleware factory. Must run *after* requireAuth, since it relies on
 * req.user having already been populated from the verified server-side
 * session -- the role is never read from the request body or any
 * client-supplied field.
 *
 * Usage:
 *   router.post("/categories", requireAuth, requireRole("admin"), ...)
 *   router.patch("/tickets/:id", requireAuth, requireRole("moderator", "admin"), ...)
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      // Defensive check: requireRole should always be chained after
      // requireAuth, but fail closed if that invariant is ever broken.
      next(ApiError.unauthorized());
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }

    next();
  };
}
