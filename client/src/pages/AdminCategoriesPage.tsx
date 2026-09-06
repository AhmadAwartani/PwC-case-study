import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useCategoriesQuery, useCreateCategory } from "../hooks/queries";
import { useToast } from "../context/ToastContext";
import { ApiRequestError } from "../api/client";

export function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCategoriesQuery();
  const createCategory = useCreateCategory();
  const { showSuccess, showError } = useToast();
  const [name, setName] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCategory.mutateAsync(name.trim());
      showSuccess(t("adminCategories.created", { name: name.trim() }));
      setName("");
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        showError(t("adminCategories.duplicate", { name: name.trim() }));
      } else {
        showError(err instanceof ApiRequestError ? err.message : t("adminCategories.createError"));
      }
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-ink">{t("adminCategories.title")}</h1>
      <p className="mt-0.5 text-sm text-ink-soft">{t("adminCategories.subtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-5 flex max-w-md gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("adminCategories.placeholder")}
          className="flex-1 rounded border border-border px-3 py-1.5 text-sm"
        />
        <button
          type="submit"
          disabled={createCategory.isPending || !name.trim()}
          className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {t("adminCategories.addCategory")}
        </button>
      </form>

      <div className="mt-5 max-w-md overflow-hidden rounded-lg border border-border bg-surface">
        {isLoading ? (
          <div className="p-4 text-sm text-ink-soft">{t("common.loading")}</div>
        ) : (
          <ul className="divide-y divide-border">
            {data?.data.map((cat) => (
              <li key={cat.id} className="px-4 py-2.5 text-sm text-ink">
                {cat.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
