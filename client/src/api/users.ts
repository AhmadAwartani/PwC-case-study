import { apiRequest } from "./client";
import type { Paginated, Role, User } from "../types";

export function listUsers(params: { role?: Role; page?: number; limit?: number } = {}) {
  return apiRequest<Paginated<User>>("/users", {
    query: { role: params.role, page: params.page ?? 1, limit: params.limit ?? 20 },
  });
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export function createUser(input: CreateUserInput) {
  return apiRequest<{ data: User }>("/users", { method: "POST", body: input });
}

export function updateUser(id: string, input: { role?: Role; isActive?: boolean }) {
  return apiRequest<{ data: User }>(`/users/${id}`, { method: "PATCH", body: input });
}