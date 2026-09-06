import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiRequestError } from "../api/client";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Bug fix (Phase 4 integration testing): these previously called `t` from a
// bare `import { t } from "i18next"` (the static, un-subscribed instance)
// rather than the component's `useTranslation()` hook -- meaning an
// already-shown validation message wouldn't retranslate if the language
// was switched afterward without re-triggering validation. Accepting the
// hook-bound `t` as a parameter fixes that while keeping every existing
// translation key exactly as-is.
function validateEmail(value: string, t: TFunction): string | null {
  if (!value.trim()) return t("login.emailRequired");
  if (!EMAIL_PATTERN.test(value)) return t("login.emailInvalid");
  return null;
}

function validatePassword(value: string, t: TFunction): string | null {
  if (!value) return t("login.passwordRequired");
  if (value.length < 8) return t("login.passwordTooShort");
  return null;
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const emailValidation = validateEmail(email, t);
    const passwordValidation = validatePassword(password, t);
    setEmailError(emailValidation);
    setPasswordError(passwordValidation);

    if (emailValidation || passwordValidation) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : t("login.genericError")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-ink">{t("login.title")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("login.subtitle")}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-3.5">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">{t("login.email")}</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              onBlur={() => setEmailError(validateEmail(email, t))}
              aria-invalid={Boolean(emailError)}
              className={`rounded border px-3 py-1.5 ${
                emailError ? "border-priority-urgent" : "border-border"
              }`}
              placeholder="you@example.com"
            />
            {emailError && (
              <span role="alert" className="text-xs text-priority-urgent">
                {emailError}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-ink">{t("login.password")}</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              onBlur={() => setPasswordError(validatePassword(password, t))}
              aria-invalid={Boolean(passwordError)}
              className={`rounded border px-3 py-1.5 ${
                passwordError ? "border-priority-urgent" : "border-border"
              }`}
              placeholder="••••••••"
            />
            {passwordError && (
              <span role="alert" className="text-xs text-priority-urgent">
                {passwordError}
              </span>
            )}
          </label>

          {formError && (
            <p role="alert" className="text-sm text-priority-urgent">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-1 rounded bg-primary px-3.5 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {isSubmitting ? t("login.submitting") : t("login.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}