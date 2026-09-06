import { Request, Response, NextFunction } from "express";
import { authenticate } from "../services/auth.service";
import { LoginInput } from "../schemas/auth.schema";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../lib/session";
import { ApiError } from "../lib/apiError";

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as LoginInput;
    const user = await authenticate(input);

    const { token, maxAge } = createSessionToken(user.id);
    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions(maxAge));

    res.status(200).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  // See README for a note on the stateless signed-cookie session approach
  // used in Phase 1, and the trade-off it implies for logout.
  res.clearCookie(SESSION_COOKIE_NAME, { ...sessionCookieOptions(), maxAge: 0 });
  res.status(200).json({ data: { success: true } });
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    res.status(200).json({ data: req.user });
  } catch (err) {
    next(err);
  }
}
