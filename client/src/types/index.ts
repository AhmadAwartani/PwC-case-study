export type Role = "user" | "moderator" | "admin";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export const TICKET_STATUSES: TicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];
export const TICKET_PRIORITIES: TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  categoryId: string;
  requesterId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
  author?: { id: string; name: string; email: string };
}

export interface TicketDetail extends Ticket {
  category: Category;
  requester: { id: string; name: string; email: string };
  assignee: { id: string; name: string; email: string } | null;
  comments: TicketComment[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface TicketListFilters {
  page: number;
  limit: number;
  status: TicketStatus[];
  priority: TicketPriority[];
  category: string[];
  assignee: "" | "me" | "unassigned" | string;
  search: string;
  sortBy: "createdAt" | "priority";
  sortDir: "asc" | "desc";
}
