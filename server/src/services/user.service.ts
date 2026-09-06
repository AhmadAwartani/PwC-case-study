import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/apiError";
import { buildPagination, PaginationMeta } from "../lib/pagination";
import { PublicUser, Role } from "../types";
import { CreateUserInput, ListUsersQuery, UpdateUserInput } from "../schemas/user.schema";


// update responses so there's a single place that guarantees that.
const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export async function listUsers(
  query: ListUsersQuery
): Promise<{ data: PublicUser[]; pagination: PaginationMeta }> {
  const where = query.role ? { role: query.role } : {};

  const [users, totalItems] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: "asc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map((u) => ({
      ...u,
      role: u.role as Role,
    })),
    pagination: buildPagination(query.page, query.limit, totalItems),
  };
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const created = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: SAFE_USER_SELECT,
  });

  return { ...created, role: created.role as Role };
}

export async function updateUser(
  actingUser: PublicUser,
  targetUserId: string,
  input: UpdateUserInput
): Promise<PublicUser> {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    throw ApiError.notFound("User not found.");
  }

  // Prevent lockout: an admin can't deactivate the account they're currently
  // authenticated as.
  if (input.isActive === false && targetUserId === actingUser.id) {
    throw ApiError.badRequest("You cannot deactivate your own account.");
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: SAFE_USER_SELECT,
  });

  return { ...updated, role: updated.role as Role };
}
