"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { SingleResponse } from "@/lib/response";
import { ConfirmDialog } from "./confirm-dialog";

interface AdminAccount {
  id: string;
  username: string;
  email: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

export function AdminsManager() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Create ───────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // ── Delete ───────────────────────────────────────────────────
  const [deletingAdmin, setDeletingAdmin] = useState<AdminAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Password reset ───────────────────────────────────────────
  const [pwAdmin, setPwAdmin] = useState<AdminAccount | null>(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<SingleResponse<AdminAccount[]>>(
        "/api/admin/admins",
      );
      setAdmins(res.data);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to load admins.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setCreateError("All fields are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await apiClient.post<SingleResponse<AdminAccount>>(
        "/api/admin/admins",
        {
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
        },
      );
      setAdmins((prev) => [...prev, res.data as unknown as AdminAccount]);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setShowCreate(false);
    } catch (err) {
      setCreateError(
        err instanceof ApiClientError ? err.message : "Failed to create admin.",
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAdmin) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/api/admin/admins/${deletingAdmin.id}`);
      setAdmins((prev) => prev.filter((a) => a.id !== deletingAdmin.id));
      setDeletingAdmin(null);
    } catch (err) {
      setDeleteError(
        err instanceof ApiClientError ? err.message : "Failed to delete.",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwAdmin) return;
    setPwError(null);
    setPwSuccess(false);
    if (!currentPw || !newPw) {
      setPwError("Both fields are required.");
      return;
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwSaving(true);
    try {
      await apiClient.put(`/api/admin/admins/${pwAdmin.id}`, {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      setPwError(
        err instanceof ApiClientError ? err.message : "Failed to change password.",
      );
    } finally {
      setPwSaving(false);
    }
  };

  const formatDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // ── Render ──────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-2xl">
        {/* Header + Add button */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">
            {admins.length} account{admins.length !== 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={() => setShowCreate((s) => !s)}
            className="text-sm font-medium border border-[var(--color-border)] px-5 py-2 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
          >
            {showCreate ? "✕ Cancel" : "+ Add Admin"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="border border-[var(--color-border)] p-6 mb-6 space-y-4"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
              New Admin Account
            </p>
            {createError && (
              <p className="text-xs font-mono text-[var(--color-accent)]">
                {createError}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
                  Username *
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  disabled={creating}
                  className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={creating}
                  className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
                Password * (min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={creating}
                className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="bg-[var(--color-foreground)] text-[var(--color-background)] px-8 py-3 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Admin →"}
            </button>
          </form>
        )}

        {/* List */}
        {loading ? (
          <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
            {[1, 2].map((i) => (
              <div key={i} className="px-6 py-4 animate-pulse flex gap-4">
                <div className="h-4 bg-[var(--color-muted-bg)] w-32" />
                <div className="h-4 bg-[var(--color-muted-bg)] w-48" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="border border-[var(--color-accent)] px-6 py-4">
            <p className="text-sm font-mono text-[var(--color-accent)]">{error}</p>
            <button onClick={load} className="mt-1 text-xs underline">
              Retry
            </button>
          </div>
        ) : (
          <div className="border border-[var(--color-border-light)]">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-foreground)] text-[var(--color-background)]">
                  {["Username", "Email", "Last Login", "Created", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 last:border-r-0 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-[var(--color-muted-bg)] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium border-r border-[var(--color-border-light)]">
                      {admin.username}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)]">
                      {admin.email}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)]">
                      {formatDate(admin.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)]">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-0 border border-[var(--color-border-light)] w-fit">
                        <button
                          type="button"
                          onClick={() => {
                            setPwAdmin(admin);
                            setPwError(null);
                            setPwSuccess(false);
                            setCurrentPw("");
                            setNewPw("");
                          }}
                          className="px-3 py-1.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
                        >
                          Reset PW
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingAdmin(admin)}
                          className="px-3 py-1.5 text-xs font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingAdmin}
        title="Delete Admin"
        message={
          deletingAdmin
            ? `Delete the admin account "${deletingAdmin.username}"? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeletingAdmin(null);
          setDeleteError(null);
        }}
      />

      {/* Password reset overlay */}
      {pwAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[var(--color-foreground)]/60"
            onClick={() => setPwAdmin(null)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-sm border-2 border-[var(--color-border)] bg-[var(--color-background)] p-8">
            <h2 className="font-display text-3xl mb-1">Reset Password</h2>
            <p className="text-xs font-mono text-[var(--color-muted)] mb-6 uppercase tracking-widest">
              {pwAdmin.username}
            </p>

            {pwSuccess ? (
              <div className="text-center py-4">
                <p className="font-mono text-3xl text-green-600 mb-3">✓</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Password changed successfully.
                </p>
                <button
                  type="button"
                  onClick={() => setPwAdmin(null)}
                  className="mt-4 text-sm underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} noValidate className="space-y-4">
                {pwError && (
                  <p className="text-xs font-mono text-[var(--color-accent)]">
                    {pwError}
                  </p>
                )}
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    disabled={pwSaving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5">
                    New Password * (min 8 chars)
                  </label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    disabled={pwSaving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="flex gap-0 border border-[var(--color-border)] pt-2">
                  <button
                    type="button"
                    onClick={() => setPwAdmin(null)}
                    disabled={pwSaving}
                    className="flex-1 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwSaving}
                    className="flex-1 py-3 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {pwSaving ? "Saving…" : "Save"}
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
