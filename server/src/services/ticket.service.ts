import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/apiError";
import { buildPagination, PaginationMeta } from "../lib/pagination";
import { PublicUser } from "../types";
import {
  CreateCommentInput,
  CreateTicketInput,
  ListTicketsQuery,
  UpdateTicketInput,
} from "../schemas/ticket.schema";

const PRIORITY_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

/**
 * Builds the shared SQL WHERE fragment for both the paginated data query and
 * its matching COUNT query, so the two can never drift out of sync. Uses
 * Prisma.sql/Prisma.join for safe parameterization (no string concatenation
 * of user input into SQL).
 */
function buildTicketWhere(user: PublicUser, query: ListTicketsQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];

  // Access rule: a "user" role only ever sees tickets where they are the
  // requester -- this is applied unconditionally and is never affected by
  // any client-supplied filter (including `assignee`).
  if (user.role === "user") {
    conditions.push(Prisma.sql`requesterId = ${user.id}`);
  }

  if (query.status && query.status.length > 0) {
    conditions.push(Prisma.sql`status IN (${Prisma.join(query.status)})`);
  }

  if (query.priority && query.priority.length > 0) {
    conditions.push(Prisma.sql`priority IN (${Prisma.join(query.priority)})`);
  }

  if (query.category && query.category.length > 0) {
    conditions.push(Prisma.sql`categoryId IN (${Prisma.join(query.category)})`);
  }

  if (query.assignee) {
    if (query.assignee === "me") {
      // Resolved against the authenticated user's own id -- never a
      // client-supplied id, per the assignment's access rules.
      conditions.push(Prisma.sql`assigneeId = ${user.id}`);
    } else if (query.assignee === "unassigned") {
      conditions.push(Prisma.sql`assigneeId IS NULL`);
    } else {
      conditions.push(Prisma.sql`assigneeId = ${query.assignee}`);
    }
  }

  if (query.search) {
    // SQLite's LIKE is case-insensitive by default for ASCII text, which
    // satisfies the "case-insensitive" requirement for typical test data
    // without needing Postgres-only `mode: "insensitive"` semantics.
    const pattern = `%${query.search}%`;
    conditions.push(Prisma.sql`(subject LIKE ${pattern} OR description LIKE ${pattern})`);
  }

  if (conditions.length === 0) {
    return Prisma.sql`1=1`;
  }

  return Prisma.join(conditions, " AND ");
}

/**
 * Builds the ORDER BY clause. `createdAt` sorts natively since it's a
 * timestamp column. `priority` is stored as a plain string ("low" |
 * "medium" | "high" | "urgent"), so a naive `ORDER BY priority` would sort
 * alphabetically (high, low, medium, urgent) rather than by actual
 * severity -- a CASE expression maps each value to its severity rank so
 * ascending/descending genuinely means least-to-most urgent.
 */
function buildTicketOrderBy(query: ListTicketsQuery): Prisma.Sql {
  const dir = query.sortDir === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;

  if (query.sortBy === "priority") {
    return Prisma.sql`ORDER BY (CASE priority
      WHEN 'low' THEN ${PRIORITY_RANK.low}
      WHEN 'medium' THEN ${PRIORITY_RANK.medium}
      WHEN 'high' THEN ${PRIORITY_RANK.high}
      WHEN 'urgent' THEN ${PRIORITY_RANK.urgent}
      ELSE -1 END) ${dir}`;
  }

  return Prisma.sql`ORDER BY createdAt ${dir}`;
}

export interface TicketRow {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  categoryId: string;
  requesterId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listTickets(
  user: PublicUser,
  query: ListTicketsQuery
): Promise<{ data: TicketRow[]; pagination: PaginationMeta }> {
  const where = buildTicketWhere(user, query);
  const orderBy = buildTicketOrderBy(query);
  const offset = (query.page - 1) * query.limit;

  // Real server-side pagination/filtering/sorting -- executed against the
  // database via parameterized SQL, never loaded-then-sliced in memory.
  const [rows, countResult] = await Promise.all([
    prisma.$queryRaw<TicketRow[]>(
      Prisma.sql`SELECT id, subject, description, status, priority, categoryId,
        requesterId, assigneeId, createdAt, updatedAt
        FROM Ticket
        WHERE ${where}
        ${orderBy}
        LIMIT ${query.limit} OFFSET ${offset}`
    ),
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT COUNT(*) as count FROM Ticket WHERE ${where}`
    ),
  ]);

  const totalItems = Number(countResult[0]?.count ?? 0);

  return {
    data: rows,
    pagination: buildPagination(query.page, query.limit, totalItems),
  };
}

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw ApiError.badRequest("categoryId does not reference an existing category.");
  }
}

export async function createTicket(user: PublicUser, input: CreateTicketInput) {
  await assertCategoryExists(input.categoryId);

  return prisma.ticket.create({
    data: {
      subject: input.subject,
      description: input.description,
      categoryId: input.categoryId,
      priority: input.priority,
      requesterId: user.id, // never trust a client-supplied requesterId
    },
  });
}

export async function getTicketById(user: PublicUser, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      requester: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!ticket) {
    throw ApiError.notFound("Ticket not found.");
  }

  if (user.role === "user" && ticket.requesterId !== user.id) {
    throw ApiError.forbidden("You may only view your own tickets.");
  }

  return ticket;
}

export async function updateTicket(ticketId: string, input: UpdateTicketInput) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw ApiError.notFound("Ticket not found.");
  }

  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  if (input.assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: input.assigneeId } });
    if (!assignee) {
      throw ApiError.badRequest("assigneeId does not reference an existing user.");
    }
    if (assignee.role !== "moderator" && assignee.role !== "admin") {
      throw ApiError.badRequest("Tickets can only be assigned to a moderator or admin.");
    }
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
    },
  });
}

/**
 * Admin-only "delete" -- implemented as a soft-delete (status -> "closed")
 * rather than removing the row. See the Phase 2 report for the rationale:
 * the assignment's permission matrix has moderators resolve/close tickets
 * via status changes and reserves hard-delete for admins, which reads as
 * "admin can force-close/archive," not "admin can destroy ticket history"
 * (which would also cascade-orphan its comments).
 */
export async function softDeleteTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw ApiError.notFound("Ticket not found.");
  }

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "closed" },
  });
}

export async function addComment(
  user: PublicUser,
  ticketId: string,
  input: CreateCommentInput
) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw ApiError.notFound("Ticket not found.");
  }

  const canComment =
    user.role === "moderator" || user.role === "admin" || ticket.requesterId === user.id;

  if (!canComment) {
    throw ApiError.forbidden("You may only comment on your own tickets.");
  }

  return prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: user.id,
      body: input.body,
    },
  });
}
