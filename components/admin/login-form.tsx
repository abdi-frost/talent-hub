"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { APP_NAME } from "@/lib/constants";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Forgot password modal ────────────────────────────────────
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/auth/login", {
        username: username.trim(),
        password,
      });
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    const email = forgotEmail.trim();
    if (!email) {
      setForgotError("Email is required.");
      return;
    }
    setForgotLoading(true);
    try {
      // Backend handles token generation + email delivery via EmailJS REST API
      await apiClient.post("/api/auth/forgot-password", { email });
      setForgotSuccess(true);
    } catch (err) {
      // Always show success to avoid user enumeration; only surface 5xx errors
      if (err instanceof ApiClientError && err.status >= 500) {
        setForgotError("Server error. Please try again later.");
      } else {
        setForgotSuccess(true);
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotOpen(false);
    setForgotEmail("");
    setForgotError(null);
    setForgotSuccess(false);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="w-full max-w-md">
          <div className="p-10">
            <h1 className="font-display text-4xl mb-1">{APP_NAME}</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-10">
              Admin Access
            </p>

            {error && (
              <div className="mb-6 border border-[var(--color-accent)] bg-[var(--color-accent)]/5 px-4 py-3">
                <p className="text-sm font-mono text-[var(--color-accent)]">
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loading}
                  className="w-full border border-[var(--color-border)] px-4 py-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full border border-[var(--color-border)] px-4 py-3 pr-12 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors select-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--color-foreground)] text-[var(--color-background)] py-3 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 mt-2"
              >
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            Restricted access. Authorised personnel only.
          </p>
        </div>
      </div>

      {/* ── Forgot password modal ──────────────────────────────── */}
      {forgotOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-pw-title"
        >
          <div
            className="fixed inset-0 bg-[var(--color-foreground)]/60"
            onClick={closeForgot}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-sm border-2 border-[var(--color-border)] bg-[var(--color-background)] p-8">
            <h2
              id="forgot-pw-title"
              className="font-display text-3xl mb-1"
            >
              Reset Password
            </h2>
            <p className="text-xs font-mono text-[var(--color-muted)] mb-6 uppercase tracking-widest">
              Enter your admin email address
            </p>

            {forgotSuccess ? (
              <div className="text-center py-4">
                <p className="font-mono text-3xl text-green-600 mb-3">✓</p>
                <p className="text-sm text-[var(--color-muted)]">
                  If that email is registered, a reset link has been sent.
                </p>
                <button
                  type="button"
                  onClick={closeForgot}
                  className="mt-5 text-sm underline font-mono"
                >
                  Back to login
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleForgotPassword}
                noValidate
                className="space-y-4"
              >
                {forgotError && (
                  <p className="text-xs font-mono text-[var(--color-accent)]">
                    {forgotError}
                  </p>
                )}
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                    autoComplete="email"
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-0 border border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={closeForgot}
                    disabled={forgotLoading}
                    className="flex-1 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-3 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending…" : "Send Link →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
