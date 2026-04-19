"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Logo } from "@/components/shared/logo";
import { ForgotPasswordModal } from "./forgot-password-modal";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/api/auth/login", { username: username.trim(), password });
      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo href="/" width={160} variant="light" />
          </div>

          <div className="border border-[var(--color-border)] p-8 sm:p-10">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-8">
              Admin Access
            </p>

            {error && (
              <div className="mb-6 border border-[var(--color-accent)] bg-[var(--color-accent)]/5 px-4 py-3">
                <p className="text-sm font-mono text-[var(--color-accent)]">{error}</p>
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
                    className="w-full border border-[var(--color-border)] px-4 py-3 pr-14 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
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

      {forgotOpen && (
        <ForgotPasswordModal onClose={() => setForgotOpen(false)} />
      )}
    </>
  );
}

