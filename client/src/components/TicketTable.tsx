import { useNavigate } from "react-router-dom";
import type { Ticket } from "../types";
import { StatusBadge, PriorityBadge } from "./Badges";
import { useTranslation } from "react-i18next";

interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  hasActiveFilters: boolean;
  categoryNameById: Record<string, string>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function TicketTable({ tickets, isLoading, hasActiveFilters, categoryNameById }: TicketTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-4 w-1/3 animate-pulse rounded bg-border" />
            <div className="h-4 w-16 animate-pulse rounded bg-border" />
            <div className="h-4 w-20 animate-pulse rounded bg-border" />
            <div className="h-4 w-24 animate-pulse rounded bg-border" />
          </div>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-4 py-16 text-center">
        <p className="font-medium text-ink">
          {hasActiveFilters ? t("table.noneMatch") : t("table.noneYet")}
        </p>
        <p className="text-sm text-ink-soft">
          {hasActiveFilters ? t("table.widenFilters") : t("table.newTicketsHere")}
        </p>
      </div>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-ink-soft">
          <th className="px-4 py-2 font-medium">{t("table.subject")}</th>
          <th className="px-4 py-2 font-medium">{t("table.status")}</th>
          <th className="px-4 py-2 font-medium">{t("table.priority")}</th>
          <th className="px-4 py-2 font-medium">{t("table.category")}</th>
          <th className="px-4 py-2 font-medium">{t("table.created")}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {tickets.map((ticket) => (
          <tr
            key={ticket.id}
            onClick={() => navigate(`/tickets/${ticket.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/tickets/${ticket.id}`);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={ticket.subject}
            className="cursor-pointer hover:bg-canvas focus-visible:bg-canvas"
          >
            <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">{ticket.subject}</td>
            <td className="px-4 py-3">
              <StatusBadge status={ticket.status} />
            </td>
            <td className="px-4 py-3">
              <PriorityBadge priority={ticket.priority} />
            </td>
            <td className="px-4 py-3 text-ink-soft">
              {categoryNameById[ticket.categoryId] ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-ink-soft">
              {formatDate(ticket.createdAt)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
