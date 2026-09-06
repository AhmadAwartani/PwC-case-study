import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCreateUser, useUpdateUser, useUsersQuery } from "../hooks/queries";
import { ApiRequestError } from "../api/client";
import type { Role } from "../types";

const ROLES: Role[] = ["user", "moderator", "admin"];

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { user: me } = useAuth();
  const { showSuccess, showError } = useToast();
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" as Role });

  const { data, isLoading } = useUsersQuery({
    role: roleFilter || undefined,
    limit: 100,
  });
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();

  async function handleCreateSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await createUser.mutateAsync(form);
      showSuccess(t("adminUsers.accountCreated", { name: form.name }));
      setForm({ name: "", email: "", password: "", role: "user" });
      setIsCreateOpen(false);
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("adminUsers.createError"));
    }
  }

  async function handleRoleChange(userId: string, role: Role) {
    try {
      await updateUser.mutateAsync({ id: userId, input: { role } });
      showSuccess(t("adminUsers.roleUpdated"));
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("adminUsers.roleUpdateError"));
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    try {
      await updateUser.mutateAsync({ id: userId, input: { isActive: !isActive } });
      showSuccess(!isActive ? t("adminUsers.accountActivated") : t("adminUsers.accountDeactivated"));
    } catch (err) {
      showError(err instanceof ApiRequestError ? err.message : t("adminUsers.updateError"));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t("adminUsers.title")}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">{t("adminUsers.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | "")}
            className="rounded border border-border px-3 py-1.5 text-sm"
          >
            <option value="">{t("adminUsers.allRoles")}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            {t("adminUsers.newAccount")}
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <form
          onSubmit={handleCreateSubmit}
          className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-canvas p-4"
        >
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-ink-soft">{t("adminUsers.name")}</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded border border-border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-ink-soft">{t("adminUsers.email")}</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded border border-border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-ink-soft">{t("adminUsers.tempPassword")}</span>
            <input
              required
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="rounded border border-border px-2 py-1 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-medium text-ink-soft">{t("adminUsers.role")}</span>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              className="rounded border border-border px-2 py-1 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={createUser.isPending}
            className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {t("adminUsers.create")}
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className="rounded border border-border px-4 py-1.5 text-sm font-medium text-ink-soft"
          >
            {t("adminUsers.cancel")}
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        {isLoading ? (
          <div className="p-4 text-sm text-ink-soft">{t("common.loading")}</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-ink-soft">
                <th className="px-4 py-2 font-medium">{t("adminUsers.name")}</th>
                <th className="px-4 py-2 font-medium">{t("adminUsers.email")}</th>
                <th className="px-4 py-2 font-medium">{t("adminUsers.role")}</th>
                <th className="px-4 py-2 font-medium">{t("adminUsers.status")}</th>
                <th className="px-4 py-2 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-ink">
                      {u.name} {isMe && <span className="text-ink-soft">{t("adminUsers.you")}</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        disabled={updateUser.isPending}
                        className="rounded border border-border px-2 py-1 text-xs"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {t(`roles.${r}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          u.isActive
                            ? "bg-status-resolved-bg text-status-resolved"
                            : "bg-status-closed-bg text-status-closed"
                        }`}
                      >
                        {u.isActive ? t("adminUsers.active") : t("adminUsers.deactivated")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={isMe || updateUser.isPending}
                        onClick={() => handleToggleActive(u.id, u.isActive)}
                        title={isMe ? t("adminUsers.cannotDeactivateSelf") : undefined}
                        className="rounded border border-border px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {u.isActive ? t("adminUsers.deactivate") : t("adminUsers.activate")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
