import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategoriesQuery, useTicketsQuery } from "../hooks/queries";
import { TicketTable } from "../components/TicketTable";
import { NewTicketModal } from "../components/NewTicketModal";
import type { TicketListFilters, TicketStatus } from "../types";

const OPEN_STATUSES: TicketStatus[] = ["open", "in_progress"];
const RESOLVED_STATUSES: TicketStatus[] = ["resolved", "closed"];

export function UserDashboardPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"open" | "resolved">("open");
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const filters: TicketListFilters = {
    page: 1,
    limit: 50,
    status: tab === "open" ? OPEN_STATUSES : RESOLVED_STATUSES,
    priority: [],
    category: [],
    assignee: "",
    search: "",
    sortBy: "createdAt",
    sortDir: "desc",
  };

  const { data, isLoading } = useTicketsQuery(filters);
  const { data: categoriesRes } = useCategoriesQuery();

  const categoryNameById = Object.fromEntries(
    (categoriesRes?.data ?? []).map((c) => [c.id, c.name])
  );

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t("dashboard.title")}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{t("dashboard.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {t("dashboard.newTicket")}
        </button>
      </div>

      <div className="mb-4 flex gap-1 border-b border-border">
        {(["open", "resolved"] as const).map((tabValue) => (
          <button
            key={tabValue}
            type="button"
            onClick={() => setTab(tabValue)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === tabValue
                ? "border-primary text-primary"
                : "border-transparent text-ink-soft hover:text-ink"
            }`}
          >
            {tabValue === "open" ? t("dashboard.open") : t("dashboard.resolved")}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <TicketTable
          tickets={data?.data ?? []}
          isLoading={isLoading}
          hasActiveFilters={false}
          categoryNameById={categoryNameById}
        />
      </div>

      {isNewTicketOpen && <NewTicketModal onClose={() => setIsNewTicketOpen(false)} />}
    </div>
  );
}