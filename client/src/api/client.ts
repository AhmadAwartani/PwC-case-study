import type { ApiErrorShape } from "../types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | string[] | undefined>;
}

function buildQueryString(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Every request includes credentials so the HTTP-only session cookie set by
 * POST /api/auth/login travels with it -- this is the entire client-side
 * auth mechanism, there is no token to attach manually.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query } = options;

  const response = await fetch(`${API_BASE}${path}${buildQueryString(query)}`, {
    method,
    credentials: "include",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204/empty-body responses (none currently, but defensive)
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const shape = data as ApiErrorShape | undefined;
    throw new ApiRequestError(
      response.status,
      shape?.error?.code ?? "UNKNOWN_ERROR",
      shape?.error?.message ?? "Something went wrong. Please try again.",
      shape?.error?.details
    );
  }

  return data as T;
}
