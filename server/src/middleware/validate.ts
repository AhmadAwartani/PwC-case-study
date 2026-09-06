import { NextFunction, Request, Response } from "express";
import { ZodError, ZodSchema } from "zod";
import { ApiError } from "../lib/apiError";

type RequestPart = "body" | "query" | "params";

declare module "express-serve-static-core" {
  interface Request {
    /**
     * Express 5 made `req.query` a read-only getter, so validated/coerced
     * query data can no longer be written back onto `req.query` itself.
     * It's attached here instead. `req.body` and `req.params` remain
     * writable in Express 5, so those are still replaced in place.
     */
    validatedQuery?: unknown;
  }
}

export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      if (part === "query") {
        req.validatedQuery = parsed;
      } else {
        (req as any)[part] = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.flatten();
        next(ApiError.badRequest("Invalid request data.", details));
        return;
      }
      next(err);
    }
  };
}