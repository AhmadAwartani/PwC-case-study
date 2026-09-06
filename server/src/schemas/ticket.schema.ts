import { z } from "zod";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "../types";

// ---------------------------------------------------------------------------
// Create / update / comment schemas (Phase 1 scaffolding, now wired in Phase 2)
// ---------------------------------------------------------------------------

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required.").max(200),
  description: z.string().trim().min(1, "Description is required."),
  categoryId: z.string().uuid("categoryId must be a valid id."),
  priority: z.enum(TICKET_PRIORITIES).default("medium"),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    categoryId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided.",
  });

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "Comment body is required."),
});

// ---------------------------------------------------------------------------
// GET /api/tickets query-parameter schema
//
// Every field is optional; comma-separated multi-select params are split
// and validated element-by-element. `page`/`limit` are coerced from the
// query-string into numbers. `assignee` is deliberately a plain string
// union rather than a strict uuid, since "me" and "unassigned" are valid
// literal values alongside an actual userId -- resolving "me" against the
// authenticated user happens in the service layer, never trusting a
// client-supplied id for that case.
// ---------------------------------------------------------------------------

const commaSeparatedEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((val) => val.split(",").map((v) => v.trim()).filter(Boolean))
    .pipe(z.array(z.enum(values as unknown as [string, ...string[]])))
    .optional();

export const listTicketsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: commaSeparatedEnum(TICKET_STATUSES),
  priority: commaSeparatedEnum(TICKET_PRIORITIES),
  category: z
    .string()
    .transform((val) => val.split(",").map((v) => v.trim()).filter(Boolean))
    .optional(),
  assignee: z
    .union([z.literal("me"), z.literal("unassigned"), z.string().uuid()])
    .optional(),
  search: z.string().trim().min(1).max(200).optional(),
  sortBy: z.enum(["createdAt", "priority"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;

