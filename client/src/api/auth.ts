import { apiRequest } from "./client";
import type { User } from "../types";

export function login(email: string, password: string) {
  return apiRequest<{ data: User }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logout() {
  return apiRequest<{ data: { success: boolean } }>("/auth/logout", { method: "POST" });
}

export function fetchMe() {
  return apiRequest<{ data: User }>("/auth/me");
}
