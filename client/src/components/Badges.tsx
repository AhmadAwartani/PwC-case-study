import { useTranslation } from "react-i18next";
import type { TicketPriority, TicketStatus } from "../types";

const STATUS_CLASSES: Record<TicketStatus, string> = {
  open: "bg-status-open-bg text-status-open",
  in_progress: "bg-status-progress-bg text-status-progress",
  resolved: "bg-status-resolved-bg text-status-resolved",
  closed: "bg-status-closed-bg text-status-closed",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {t(`status.${status}`)}
    </span>
  );
}

const PRIORITY_DOT: Record<TicketPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

const PRIORITY_TEXT: Record<TicketPriority, string> = {
  low: "text-priority-low",
  medium: "text-priority-medium",
  high: "text-priority-high",
  urgent: "text-priority-urgent",
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${PRIORITY_TEXT[priority]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[priority]}`} />
      {t(`priority.${priority}`)}
    </span>
  );
}