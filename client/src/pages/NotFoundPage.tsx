import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2 text-center">
      <p className="text-lg font-semibold text-ink">{t("notFound.title")}</p>
      <Link to="/dashboard" className="text-sm text-primary">
        {t("notFound.goToDashboard")}
      </Link>
    </div>
  );
}
