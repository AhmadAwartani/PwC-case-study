import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useCategoriesQuery, useCreateTicket } from "../hooks/queries";
import { useToast } from "../context/ToastContext";
import { ApiRequestError } from "../api/client";
import type { TicketPriority } from "../types";

export function NewTicketModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { data: categoriesRes } = useCategoriesQuery();
  const createTicket = useCreateTicket();
  const { showSuccess, showError } = useToast();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!subject.trim()) errors.subject = t("newTicketModal.subjectRequired");
    if (!description.trim()) errors.description = t("newTicketModal.descriptionRequired");
    if (!categoryId) errors.categoryId = t("newTicketModal.categoryRequired");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createTicket.mutateAsync({ subject, description, categoryId, priority });
      showSuccess(t("newTicketModal.submitted"));
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        showError(err.message);
      } else {
        showError(t("newTicketModal.submitError"));
      }
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border bg-surface p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-ink">{t("newTicketModal.title")}</h2>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">{t("newTicketModal.subject")}</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded border border-border px-3 py-1.5"
              placeholder={t("newTicketModal.subjectPlaceholder")}
            />
            {fieldErrors.subject && (
              <span className="text-xs text-priority-urgent">{fieldErrors.subject}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">{t("newTicketModal.description")}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="rounded border border-border px-3 py-1.5"
              placeholder={t("newTicketModal.descriptionPlaceholder")}
            />
            {fieldErrors.description && (
              <span className="text-xs text-priority-urgent">{fieldErrors.description}</span>
            )}
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-ink">{t("newTicketModal.category")}</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded border border-border px-3 py-1.5"
              >
                <option value="">{t("newTicketModal.selectCategory")}</option>
                {categoriesRes?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <span className="text-xs text-priority-urgent">{fieldErrors.categoryId}</span>
              )}
            </label>

            <label className="flex flex-1 flex-col gap-1 text-sm">
              <span className="font-medium text-ink">{t("newTicketModal.priority")}</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="rounded border border-border px-3 py-1.5"
              >
                <option value="low">{t("priority.low")}</option>
                <option value="medium">{t("priority.medium")}</option>
                <option value="high">{t("priority.high")}</option>
                <option value="urgent">{t("priority.urgent")}</option>
              </select>
            </label>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-border px-3.5 py-1.5 text-sm font-medium text-ink-soft"
            >
              {t("newTicketModal.cancel")}
            </button>
            <button
              type="submit"
              disabled={createTicket.isPending}
              className="rounded bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {createTicket.isPending ? t("newTicketModal.submitting") : t("newTicketModal.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
