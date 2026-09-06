import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  useCloseTicket,
  useTicketQuery,
  useUpdateTicket,
  useUsersQuery,
} from "../hooks/queries";
import { StatusBadge, PriorityBadge } from "../components/Badges";
import { CommentThread } from "../components/CommentThread";
import { ApiRequestError } from "../api/client";
import { TICKET_PRIORITIES, TICKET_STATUSES } from "../types";
import type { TicketPriority, TicketStatus } from "../types";
import { useTranslation } from "react-i18next";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { data, isLoading, error } = useTicketQuery(id);
  const updateTicket = useUpdateTicket(id ?? "");
  const closeTicket = useCloseTicket();
  const { data: moderatorsRes } = useUsersQuery({ role: "moderator" });
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const { t } = useTranslation();

  const canManage = user?.role === "moderator" || user?.role === "admin";

  if (isLoading) {
    return <div className="p-6 text-sm text-ink-soft">Loading…</div>;
  }

  if (error || !data) {
    const isForbidden = error instanceof ApiRequestError && error.status === 403;
    const isNotFound = error instanceof ApiRequestError && error.status === 404;
    return (
      <div className="p-6">
        <p className="font-medium text-ink">
          {isForbidden
           ? t("ticketDetail.forbidden")
           : isNotFound
             ? t("ticketDetail.notFound")
             : t("ticketDetail.loadError")}
        </p>
        <Link to="/dashboard" className="mt-2 inline-block text-sm text-primary">
          ← {t("ticketDetail.backToDashboard")}
        </Link>
      </div>
    );
  }

  const ticket = data.data;

  async function handleStatusChange(status: TicketStatus) {
    try {
      await updateTicket.mutateAsync({ status });
      showSuccess(t("ticketDetail.statusUpdated"));
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("ticketDetail.statusUpdateError"));
    }
  }

  async function handlePriorityChange(priority: TicketPriority) {
    try {
      await updateTicket.mutateAsync({ priority });
      showSuccess(t("ticketDetail.priorityUpdated"));
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("ticketDetail.priorityUpdateError"));
    }
  }

  async function handleAssign(assigneeId: string) {
    try {
      await updateTicket.mutateAsync({ assigneeId: assigneeId || null });
      showSuccess(assigneeId ? t("ticketDetail.ticketAssigned") : t("ticketDetail.ticketUnassigned"));
      setAssigneeDraft("");
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("ticketDetail.assignError"));
    }
  }

  async function handleClose() {
    try {
      await closeTicket.mutateAsync(ticket.id);
      showSuccess(t("ticketDetail.ticketClosed"));
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("ticketDetail.closeError"));
    }
  }

   return (
    <div className="p-6">
      <Link to="/dashboard" className="ml-5 text-sm text-ink-soft hover:text-primary">
        ← {t("ticketDetail.back")}
      </Link>

      <div className="mx-auto max-w-3xl">
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">{ticket.subject}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {t("ticketDetail.submittedBy", {
                name: ticket.requester.name,
                date: formatDateTime(ticket.createdAt),
              })}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap rounded border border-border bg-surface p-4 text-sm text-ink">
          {ticket.description}
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <dt className="text-xs text-ink-soft">{t("ticketDetail.category")}</dt>
             <dd className="text-ink">{ticket.category.name}</dd>
             </div>
             <div>
             <dt className="text-xs text-ink-soft">{t("ticketDetail.assignee")}</dt>
             <dd className="text-ink">{ticket.assignee?.name ?? t("ticketDetail.unassigned")}</dd>
             </div>
             <div>
             <dt className="text-xs text-ink-soft">{t("ticketDetail.lastUpdated")}</dt>
            <dd className="text-ink">{formatDateTime(ticket.updatedAt)}</dd>
          </div>
        </dl>

        {canManage && (
          <div className="mt-5 flex flex-wrap items-end gap-4 rounded border border-border bg-canvas p-4">
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-ink-soft">{t("ticketDetail.status")}</span>
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                disabled={updateTicket.isPending}
                className="rounded border border-border px-2 py-1 text-sm"
              >
                {TICKET_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-ink-soft">{t("ticketDetail.priority")}</span>
              <select
                value={ticket.priority}
                onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                disabled={updateTicket.isPending}
                className="rounded border border-border px-2 py-1 text-sm"
              >
                {TICKET_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-ink-soft">{t("ticketDetail.assignee")}</span>
              <select
                value={assigneeDraft || ticket.assigneeId || ""}
                onChange={(e) => handleAssign(e.target.value)}
                disabled={updateTicket.isPending}
                className="rounded border border-border px-2 py-1 text-sm"
              >
                <option value="">{t("ticketDetail.unassigned")}</option>
                {moderatorsRes?.data.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </label>

            {user?.role === "admin" && ticket.status !== "closed" && (
              <button
                type="button"
                onClick={handleClose}
                disabled={closeTicket.isPending}
                className="ml-auto rounded border border-priority-urgent/40 px-3 py-1.5 text-xs font-medium text-priority-urgent hover:bg-red-50 disabled:opacity-60"
              >
                {t("ticketDetail.closeTicket")}
              </button>
            )}
          </div>
        )}

        <div className="mt-6 border-t border-border pt-6">
          <CommentThread ticketId={ticket.id} comments={ticket.comments} />
        </div>
      </div>
    </div>
  );
}
