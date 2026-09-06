import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";
import type { TicketListFilters, TicketPriority, TicketStatus } from "../types";

const DEFAULTS: TicketListFilters = {
  page: 1,
  limit: 20,
  status: [],
  priority: [],
  category: [],
  assignee: "",
  search: "",
  sortBy: "createdAt",
  sortDir: "desc",
};

/**
 * Keeps ticket-list filter/sort/page state in the URL's query string, so a
 * link to a filtered view is shareable and survives a page refresh -- the
 * URL is the single source of truth, not component state.
 */
export function useTicketFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: TicketListFilters = useMemo(() => {
    const split = (key: string) => {
      const val = searchParams.get(key);
      return val ? val.split(",").filter(Boolean) : [];
    };
    return {
      page: Number(searchParams.get("page") ?? DEFAULTS.page),
      limit: Number(searchParams.get("limit") ?? DEFAULTS.limit),
      status: split("status") as TicketStatus[],
      priority: split("priority") as TicketPriority[],
      category: split("category"),
      assignee: searchParams.get("assignee") ?? DEFAULTS.assignee,
      search: searchParams.get("search") ?? DEFAULTS.search,
      sortBy: (searchParams.get("sortBy") as TicketListFilters["sortBy"]) ?? DEFAULTS.sortBy,
      sortDir: (searchParams.get("sortDir") as TicketListFilters["sortDir"]) ?? DEFAULTS.sortDir,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<TicketListFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams();
      if (next.page !== DEFAULTS.page) params.set("page", String(next.page));
      if (next.limit !== DEFAULTS.limit) params.set("limit", String(next.limit));
      if (next.status.length) params.set("status", next.status.join(","));
      if (next.priority.length) params.set("priority", next.priority.join(","));
      if (next.category.length) params.set("category", next.category.join(","));
      if (next.assignee) params.set("assignee", next.assignee);
      if (next.search) params.set("search", next.search);
      if (next.sortBy !== DEFAULTS.sortBy) params.set("sortBy", next.sortBy);
      if (next.sortDir !== DEFAULTS.sortDir) params.set("sortDir", next.sortDir);
      setSearchParams(params, { replace: true });
    },
    [filters, setSearchParams]
  );

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.category.length > 0 ||
    Boolean(filters.assignee) ||
    Boolean(filters.search);

  return { filters, setFilters, hasActiveFilters };
}
