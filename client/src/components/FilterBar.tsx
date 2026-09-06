import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Category, TicketListFilters, User } from "../types";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "../types";

interface FilterBarProps {
  filters: TicketListFilters;
  categories: Category[];
  moderators: User[];
  onChange: (patch: Partial<TicketListFilters>) => void;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-white"
          : "border-border bg-surface text-ink-soft hover:border-primary/40"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterBar({ filters, categories, moderators, onChange }: FilterBarProps) {
  const { t } = useTranslation();
  const [searchDraft, setSearchDraft] = useState(filters.search);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft !== filters.search) {
        onChange({ search: searchDraft, page: 1 });
      }
    }, 400);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder={t("filters.searchPlaceholder")}
          className="w-64 rounded border border-border px-3 py-1.5 text-sm placeholder:text-ink-soft/70"
        />

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-soft">{t("filters.status")}</span>
          {TICKET_STATUSES.map((status) => (
            <Pill
              key={status}
              active={filters.status.includes(status)}
              onClick={() => onChange({ status: toggle(filters.status, status), page: 1 })}
            >
              {t(`status.${status}`)}
            </Pill>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-soft">{t("filters.priority")}</span>
          {TICKET_PRIORITIES.map((priority) => (
            <Pill
              key={priority}
              active={filters.priority.includes(priority)}
              onClick={() => onChange({ priority: toggle(filters.priority, priority), page: 1 })}
            >
              {t(`priority.${priority}`)}
            </Pill>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-soft">{t("filters.category")}</span>
            {categories.map((cat) => (
              <Pill
                key={cat.id}
                active={filters.category.includes(cat.id)}
                onClick={() => onChange({ category: toggle(filters.category, cat.id), page: 1 })}
              >
                {cat.name}
              </Pill>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-soft">{t("filters.assignee")}</span>
          <select
            value={filters.assignee}
            onChange={(e) => onChange({ assignee: e.target.value, page: 1 })}
            className="rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
          >
            <option value="">{t("filters.anyone")}</option>
            <option value="unassigned">{t("filters.unassigned")}</option>
            <option value="me">{t("filters.assignedToMe")}</option>
            {moderators.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.name}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs text-ink-soft">{t("filters.sortBy")}</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({ sortBy: e.target.value as TicketListFilters["sortBy"], page: 1 })
            }
            className="rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
          >
            <option value="createdAt">{t("filters.dateCreated")}</option>
            <option value="priority">{t("filters.priorityOption")}</option>
          </select>
          <button
            type="button"
            onClick={() =>
              onChange({ sortDir: filters.sortDir === "asc" ? "desc" : "asc", page: 1 })
            }
            className="rounded border border-border px-2 py-1 text-xs text-ink-soft hover:border-primary/40"
            title={filters.sortDir === "asc" ? t("filters.ascending") : t("filters.descending")}
          >
            {filters.sortDir === "asc" ? t("filters.asc") : t("filters.desc")}
          </button>
        </div>
      </div>
    </div>
  );
}