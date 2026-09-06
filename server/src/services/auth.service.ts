import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/apiError";
import { PublicUser, Role } from "../types";
import { LoginInput } from "../schemas/auth.schema";

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * Validates credentials and returns the safe public user representation.
 * Throws a 401 ApiError for any of: unknown email, wrong password, or
 * deactivated account -- deliberately using the same error for "unknown
 * email" and "wrong password" so the API never reveals which one it was.
 */
export async function authenticate(input: LoginInput): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  if (!user.isActive) {
    throw ApiError.unauthorized("This account has been deactivated.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  return toPublicUser(user);
}
