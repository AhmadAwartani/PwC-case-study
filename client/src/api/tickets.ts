import { apiRequest } from "./client";
import type { Paginated, Ticket, TicketComment, TicketDetail, TicketListFilters } from "../types";

export function listTickets(filters: TicketListFilters) {
  return apiRequest<Paginated<Ticket>>("/tickets", {
    query: {
      page: filters.page,
      limit: filters.limit,
      status: filters.status,
      priority: filters.priority,
      category: filters.category,
      assignee: filters.assignee || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    },
  });
}

export function getTicket(id: string) {
  return apiRequest<{ data: TicketDetail }>(`/tickets/${id}`);
}

export interface CreateTicketInput {
  subject: string;
  description: string;
  categoryId: string;
  priority: string;
}

export function createTicket(input: CreateTicketInput) {
  return apiRequest<{ data: Ticket }>("/tickets", { method: "POST", body: input });
}

export interface UpdateTicketInput {
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  categoryId?: string;
}

export function updateTicket(id: string, input: UpdateTicketInput) {
  return apiRequest<{ data: Ticket }>(`/tickets/${id}`, { method: "PATCH", body: input });
}

export function closeTicket(id: string) {
  return apiRequest<{ data: Ticket }>(`/tickets/${id}`, { method: "DELETE" });
}

export function addComment(id: string, body: string) {
  return apiRequest<{ data: TicketComment }>(`/tickets/${id}/comments`, {
    method: "POST",
    body: { body },
  });
}
