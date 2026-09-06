import { useTranslation } from "react-i18next";

interface PaginationProps {
  page: number;
  totalPages: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function Pagination({ page, totalPages, limit, onPageChange, onLimitChange }: PaginationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-ink-soft">
      <div className="flex items-center gap-2">
        <span>{t("pagination.rowsPerPage")}</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded border border-border bg-surface px-2 py-1 text-ink"
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <span>{t("pagination.pageOf", { page, totalPages })}</span>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded border border-border px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("pagination.previous")}
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded border border-border px-2.5 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("pagination.next")}
          </button>
        </div>
      </div>
    </div>
  );
}