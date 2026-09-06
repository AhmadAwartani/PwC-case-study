import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function RequireAuth() {
  const { user, isLoadingSession } = useAuth();
  const { t } = useTranslation();

  if (isLoadingSession) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-ink-soft">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
