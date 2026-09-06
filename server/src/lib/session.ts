import crypto from "crypto";
import { env } from "../config/env";

export const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SessionPayload {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", env.sessionSecret).update(value).digest("hex");
}

/**
 * Builds a signed session token of the form `<base64Payload>.<hmacSignature>`.
 * This is a self-contained, stateless session (similar in spirit to a JWT,
 * but hand-rolled to avoid an extra dependency for Phase 1). The signature
 * prevents tampering; the cookie itself is HTTP-only so it isn't reachable
 * from client-side JS.
 */
export function createSessionToken(userId: string): { token: string; maxAge: number } {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + SESSION_MAX_AGE_MS;
  const payload: SessionPayload = { userId, issuedAt, expiresAt };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encoded);
  return { token: `${encoded}.${signature}`, maxAge: SESSION_MAX_AGE_MS };
}

/**
 * Verifies a session token's signature and expiry. Returns the userId if
 * valid, or null if the token is missing, malformed, tampered with, or expired.
 */
export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  const expectedSignature = sign(encoded);
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (Date.now() > payload.expiresAt) return null;
    return payload.userId;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    maxAge: maxAge ?? SESSION_MAX_AGE_MS,
    path: "/",
  };
}
