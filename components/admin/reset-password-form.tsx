"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { Logo } from "@/components/shared/logo";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("No reset token found. Please request a new link.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError("Password is required.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to reset password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo href="/admin" width={160} variant="light" />
        </div>
        <div className="border border-[var(--color-border)] p-8 sm:p-10">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-8">
            Set New Password
          </p>

          {success ? (
            <div className="text-center py-6">
              <p className="font-mono text-4xl text-green-600 mb-3">✓</p>
              <p className="text-sm text-[var(--color-muted)] mb-6">
                Your password has been updated. You can now sign in.
              </p>
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className="bg-[var(--color-foreground)] text-[var(--color-background)] px-8 py-3 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Go to Login →
              </button>
            </div>
          ) : (
            <>
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
                    htmlFor="new-password"
                    className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={loading || !token}
                      autoComplete="new-password"
                      className="w-full border border-[var(--color-border)] px-4 py-3 pr-12 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors select-none"
                      tabIndex={-1}
                    >
                      {showNew ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || !token}
                      autoComplete="new-password"
                      className="w-full border border-[var(--color-border)] px-4 py-3 pr-12 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors select-none"
                      tabIndex={-1}
                    >
                      {showConfirm ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full bg-[var(--color-foreground)] text-[var(--color-background)] py-3 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Saving…" : "Set Password →"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Restricted access. Authorised personnel only.
        </p>
      </div>
    </div>
  );
}
