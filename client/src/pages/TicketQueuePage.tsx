import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTicketFilters } from "../hooks/useTicketFilters";
import { useCategoriesQuery, useTicketsQuery, useUsersQuery } from "../hooks/queries";
import { FilterBar } from "../components/FilterBar";
import { TicketTable } from "../components/TicketTable";
import { Pagination } from "../components/Pagination";
import { NewTicketModal } from "../components/NewTicketModal";

function SummaryStat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <p className="text-2xl font-semibold text-ink">{value ?? "—"}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

export function TicketQueuePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { filters, setFilters, hasActiveFilters } = useTicketFilters();
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  const { data, isLoading } = useTicketsQuery(filters);
  const { data: categoriesRes } = useCategoriesQuery();
  const { data: moderatorsRes } = useUsersQuery({ role: "moderator" });

  const unassignedCount = useTicketsQuery({ ...filters, page: 1, limit: 1, assignee: "unassigned" });
  const assignedToMeCount = useTicketsQuery({ ...filters, page: 1, limit: 1, assignee: "me" });
  const urgentCount = useTicketsQuery({ ...filters, page: 1, limit: 1, priority: ["urgent"], assignee: "" });

  const categoryNameById = useMemo(
    () => Object.fromEntries((categoriesRes?.data ?? []).map((c) => [c.id, c.name])),
    [categoriesRes]
  );

  return (
    <div className="flex h-screen flex-col p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t("queue.title")}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {user?.role === "admin" ? t("queue.subtitleAdmin") : t("queue.subtitleModerator")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsNewTicketOpen(true)}
          className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          {t("queue.newTicket")}
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        <SummaryStat label={t("queue.unassigned")} value={unassignedCount.data?.pagination.totalItems} />
        <SummaryStat label={t("queue.assignedToMe")} value={assignedToMeCount.data?.pagination.totalItems} />
        <SummaryStat label={t("queue.urgent")} value={urgentCount.data?.pagination.totalItems} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <FilterBar
          filters={filters}
          categories={categoriesRes?.data ?? []}
          moderators={moderatorsRes?.data ?? []}
          onChange={setFilters}
        />

        <div className="flex-1 overflow-auto">
          <TicketTable
            tickets={data?.data ?? []}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            categoryNameById={categoryNameById}
          />
        </div>

        {data && data.pagination.totalItems > 0 && (
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            limit={data.pagination.limit}
            onPageChange={(page) => setFilters({ page })}
            onLimitChange={(limit) => setFilters({ limit, page: 1 })}
          />
        )}
      </div>

      {isNewTicketOpen && <NewTicketModal onClose={() => setIsNewTicketOpen(false)} />}
    </div>
  );
}