import { useState } from "react";
import type { FormEvent } from "react";
import type { TicketComment } from "../types";
import { useAddComment } from "../hooks/queries";
import { useToast } from "../context/ToastContext";
import { ApiRequestError } from "../api/client";
import { useTranslation } from "react-i18next";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CommentThread({ ticketId, comments }: { ticketId: string; comments: TicketComment[] }) {
  const [body, setBody] = useState("");
  const addComment = useAddComment(ticketId);
  const { showError } = useToast();
  const { t } = useTranslation();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await addComment.mutateAsync(body);
      setBody("");
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : "Couldn't post your reply.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-ink">{t("comments.activity")}</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-soft">{t("comments.none")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded border border-border bg-canvas px-3.5 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">
                  {comment.author?.name ?? "Unknown"}
                </span>
                <span className="font-mono text-xs text-ink-soft">
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={t("comments.placeholder")}
          className="rounded border border-border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={addComment.isPending || !body.trim()}
          className="self-end rounded bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {addComment.isPending ? t("comments.posting") : t("comments.post")}
        </button>
      </form>
    </div>
  );
}
