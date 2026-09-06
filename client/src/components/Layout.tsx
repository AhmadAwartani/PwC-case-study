import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { setLanguage } from "../i18n";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      showSuccess(t("layout.signedOutToast"));
      navigate("/login");
    } catch {
      showError(t("layout.signOutError"));
    }
  }

  if (!user) return <>{children}</>;

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm font-medium ${
      isActive ? "bg-primary-soft text-primary" : "text-ink-soft hover:bg-canvas"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-border bg-surface">
        <div className="border-b border-border px-4 py-4">
          <p className="font-semibold text-ink">{t("layout.appName")}</p>
          <p className="mt-0.5 text-xs text-ink-soft">{t(`roles.${user.role}`)}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          <NavLink to="/dashboard" end className={navItemClass}>
            {user.role === "user" ? t("layout.myTickets") : t("layout.ticketQueue")}
          </NavLink>
          {user.role === "admin" && (
            <>
              <NavLink to="/admin/users" className={navItemClass}>
                {t("layout.users")}
              </NavLink>
              <NavLink to="/admin/categories" className={navItemClass}>
                {t("layout.categories")}
              </NavLink>
            </>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          <p className="truncate text-xs text-ink-soft">{user.email}</p>
          <button
            type="button"
            onClick={toggleTheme}
            className="mt-2 w-full rounded border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-primary/40 hover:text-primary"
          >
            {theme === "dark" ? `☀ ${t("layout.lightMode")}` : `🌙 ${t("layout.darkMode")}`}
          </button>
          <button
            type="button"
            onClick={() => setLanguage(i18n.language === "ar" ? "en" : "ar")}
            className="mt-2 w-full rounded border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-primary/40 hover:text-primary"
          >
            {i18n.language === "ar" ? "English" : "العربية"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded border border-border px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-primary/40 hover:text-primary"
          >
            {t("layout.signOut")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}