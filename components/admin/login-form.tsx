"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { APP_NAME } from "@/lib/constants";

export function AdminLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[var(--color-border)] p-10">
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
                className="w-full border border-[var(--color-border)] px-4 py-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
              />
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
  );
}
