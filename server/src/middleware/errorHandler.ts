import { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/apiError";
import { env } from "../config/env";

/**
 * Centralized error handler. Every route/middleware forwards errors here via
 * next(err) rather than formatting error responses inline. Keeps the JSON
 * error shape consistent across the whole API and ensures internal details
 * (stack traces, raw DB errors) never leak in production responses.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Unexpected/unhandled error -- log server-side, never expose internals.
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
      ...(env.isProduction ? {} : { details: err instanceof Error ? err.message : String(err) }),
    },
  });
}

/** Catch-all for unmatched routes -- returns a consistent 404 JSON shape. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No route matches ${req.method} ${req.originalUrl}`,
    },
  });
}
