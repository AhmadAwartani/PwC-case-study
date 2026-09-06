import { apiRequest } from "./client";
import type { Category } from "../types";

export function listCategories() {
  return apiRequest<{ data: Category[] }>("/categories");
}

export function createCategory(name: string) {
  return apiRequest<{ data: Category }>("/categories", { method: "POST", body: { name } });
}
