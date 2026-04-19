"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Email is required.");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email: trimmed });
      setSuccess(true);
    } catch (err) {
      // Only surface server errors — prevent user enumeration for everything else
      if (err instanceof ApiClientError && err.status >= 500) {
        setError("Server error. Please try again later.");
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-pw-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--color-foreground)]/60"
        onClick={handleClose}
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm border-2 border-[var(--color-border)] bg-[var(--color-background)] p-8">
        <h2 id="forgot-pw-title" className="font-display text-3xl mb-1">
          Reset Password
        </h2>
        <p className="text-xs font-mono text-[var(--color-muted)] mb-6 uppercase tracking-widest">
          Enter your admin email address
        </p>

        {success ? (
          <div className="text-center py-4">
            <p className="font-mono text-3xl text-green-600 mb-3">✓</p>
            <p className="text-sm text-[var(--color-muted)]">
              If that email is registered, a reset link has been sent.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 text-sm underline font-mono"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <p className="text-xs font-mono text-[var(--color-accent)]">
                {error}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
              />
            </div>
            <div className="flex gap-0 border border-[var(--color-border)]">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send Link →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
