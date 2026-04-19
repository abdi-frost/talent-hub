"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { SingleResponse } from "@/lib/response";
import { ConfirmDialog } from "./confirm-dialog";

interface AdminAccount {
  id: string;
  username: string;
  email: string;
  isSuperAdmin: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

// ── Shared field style ────────────────────────────────────────────
const FIELD =
  "w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50";
const LABEL =
  "block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1.5";

// ── StatusPill ────────────────────────────────────────────────────
function SuperBadge() {
  return (
    <span className="inline-block text-[10px] font-mono uppercase tracking-widest border border-[var(--color-accent)] text-[var(--color-accent)] px-1.5 py-0.5 leading-none">
      Super
    </span>
  );
}

export function AdminsManager() {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Invite form ───────────────────────────────────────────────
  const [showInvite, setShowInvite] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // ── Search ────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Delete ────────────────────────────────────────────────────
  const [deletingAdmin, setDeletingAdmin] = useState<AdminAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Send reset link ───────────────────────────────────────────
  const [sendingResetFor, setSendingResetFor] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState<Record<string, boolean>>({});

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
        err instanceof ApiClientError ? err.message : "Failed to load team.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const filtered = searchQuery
    ? admins.filter(
        (a) =>
          a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : admins;

  // ── Invite ────────────────────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSuccess(null);
    if (!inviteUsername.trim() || !inviteEmail.trim()) {
      setInviteError("Username and email are required.");
      return;
    }
    setInviting(true);
    try {
      const res = await apiClient.post<SingleResponse<AdminAccount>>(
        "/api/admin/admins",
        { username: inviteUsername.trim(), email: inviteEmail.trim() },
      );
      setAdmins((prev) => [...prev, res.data as unknown as AdminAccount]);
      setInviteUsername("");
      setInviteEmail("");
      setInviteSuccess(
        `Invite sent to ${inviteEmail.trim()}. They can set their password via the link in the email.`,
      );
      setTimeout(() => {
        setShowInvite(false);
        setInviteSuccess(null);
      }, 4000);
    } catch (err) {
      setInviteError(
        err instanceof ApiClientError ? err.message : "Failed to send invite.",
      );
    } finally {
      setInviting(false);
    }
  };

  // ── Send reset link ───────────────────────────────────────────
  const handleSendReset = async (admin: AdminAccount) => {
    setSendingResetFor(admin.id);
    try {
      await apiClient.post("/api/auth/forgot-password", { email: admin.email });
      setResetSent((prev) => ({ ...prev, [admin.id]: true }));
      setTimeout(
        () => setResetSent((prev) => ({ ...prev, [admin.id]: false })),
        5000,
      );
    } catch {
      // forgot-password always returns 200 — errors are silent
    } finally {
      setSendingResetFor(null);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
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

  const formatDate = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">
          {admins.length} account{admins.length !== 1 ? "s" : ""}
        </p>
        <button
          type="button"
          onClick={() => {
            setShowInvite((s) => !s);
            setInviteError(null);
            setInviteSuccess(null);
          }}
          className="self-start sm:self-auto text-sm font-medium border border-[var(--color-border)] px-5 py-2.5 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
        >
          {showInvite ? "✕ Cancel" : "+ Invite Admin"}
        </button>
      </div>

      {/* ── Invite form ── */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="border-2 border-[var(--color-border)] p-6 mb-8 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl">Invite Admin</p>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                An email with a password-setup link will be sent to the address
                below.
              </p>
            </div>
          </div>

          {inviteError && (
            <p className="text-xs font-mono text-[var(--color-accent)] border border-[var(--color-accent)] px-3 py-2">
              {inviteError}
            </p>
          )}

          {inviteSuccess && (
            <p className="text-xs font-mono text-green-700 border border-green-600 px-3 py-2 bg-green-50">
              ✓ {inviteSuccess}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Username *</label>
              <input
                type="text"
                autoComplete="off"
                value={inviteUsername}
                onChange={(e) => setInviteUsername(e.target.value)}
                disabled={inviting}
                placeholder="e.g. jane_admin"
                className={FIELD}
              />
            </div>
            <div>
              <label className={LABEL}>Email Address *</label>
              <input
                type="email"
                autoComplete="off"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviting}
                placeholder="jane@example.com"
                className={FIELD}
              />
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={inviting}
              className="bg-[var(--color-foreground)] text-[var(--color-background)] px-8 py-3 text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {inviting ? "Sending invite…" : "Send Invite →"}
            </button>
          </div>
        </form>
      )}

      {/* ── Search ── */}
      {!loading && !error && admins.length > 0 && (
        <div className="mb-4">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full sm:max-w-sm border border-[var(--color-border-light)] px-4 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors placeholder:text-[var(--color-muted)]"
          />
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-5 animate-pulse flex gap-4 items-center">
              <div className="h-4 bg-[var(--color-muted-bg)] w-28 rounded-none" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-44 rounded-none" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-20 rounded-none ml-auto" />
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
      ) : filtered.length === 0 ? (
        <div className="border border-[var(--color-border-light)] px-6 py-10 text-center">
          <p className="text-sm text-[var(--color-muted)]">
            {searchQuery ? `No admins match "${searchQuery}"` : "No admins yet."}
          </p>
        </div>
      ) : (
        /* ── Desktop table / Mobile cards ── */
        <>
          {/* Mobile cards — shown below sm */}
          <div className="sm:hidden space-y-px border border-[var(--color-border-light)]">
            {filtered.map((admin) => (
              <div
                key={admin.id}
                className="px-4 py-4 bg-[var(--color-background)] border-b border-[var(--color-border-light)] last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">
                      {admin.username}
                    </span>
                    {admin.isSuperAdmin && <SuperBadge />}
                  </div>
                  <RowActions
                    admin={admin}
                    sendingResetFor={sendingResetFor}
                    resetSent={resetSent}
                    onSendReset={handleSendReset}
                    onDelete={setDeletingAdmin}
                  />
                </div>
                <p className="text-xs font-mono text-[var(--color-muted)] truncate">
                  {admin.email}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  Last login: {formatDate(admin.lastLoginAt)} · Joined:{" "}
                  {formatDate(admin.createdAt)}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop table — shown from sm up */}
          <div className="hidden sm:block border border-[var(--color-border-light)] overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-[var(--color-foreground)] text-[var(--color-background)]">
                  {["#", "Username", "Email", "Last Login", "Joined", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 last:border-r-0 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {filtered.map((admin, idx) => (
                  <tr
                    key={admin.id}
                    className="hover:bg-[var(--color-muted-bg)] transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-muted)] text-center border-r border-[var(--color-border-light)] w-10">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-3.5 border-r border-[var(--color-border-light)]">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{admin.username}</span>
                        {admin.isSuperAdmin && <SuperBadge />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)]">
                      {admin.email}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)] whitespace-nowrap">
                      {formatDate(admin.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-[var(--color-muted)] border-r border-[var(--color-border-light)] whitespace-nowrap">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <RowActions
                        admin={admin}
                        sendingResetFor={sendingResetFor}
                        resetSent={resetSent}
                        onSendReset={handleSendReset}
                        onDelete={setDeletingAdmin}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Delete confirm ── */}
      {deleteError && (
        <p className="mt-3 text-xs font-mono text-[var(--color-accent)]">
          {deleteError}
        </p>
      )}
      <ConfirmDialog
        open={!!deletingAdmin}
        title="Remove Admin"
        message={
          deletingAdmin
            ? `Remove "${deletingAdmin.username}" from the team? They will lose all admin access immediately.`
            : ""
        }
        confirmLabel="Remove"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeletingAdmin(null);
          setDeleteError(null);
        }}
      />
    </>
  );
}

// ── RowActions sub-component ──────────────────────────────────────
interface RowActionsProps {
  admin: AdminAccount;
  sendingResetFor: string | null;
  resetSent: Record<string, boolean>;
  onSendReset: (admin: AdminAccount) => void;
  onDelete: (admin: AdminAccount) => void;
}

function RowActions({
  admin,
  sendingResetFor,
  resetSent,
  onSendReset,
  onDelete,
}: RowActionsProps) {
  const sending = sendingResetFor === admin.id;
  const sent = resetSent[admin.id];

  return (
    <div className="flex items-center gap-0 border border-[var(--color-border-light)] w-fit shrink-0">
      {/* Send reset link */}
      <button
        type="button"
        disabled={sending || sent}
        onClick={() => onSendReset(admin)}
        title="Send password-reset link to this admin's email"
        className="px-3 py-1.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        {sent ? "✓ Sent" : sending ? "Sending…" : "Reset Link"}
      </button>

      {/* Delete — hidden for super-admins */}
      {!admin.isSuperAdmin && (
        <button
          type="button"
          onClick={() => onDelete(admin)}
          title="Remove this admin"
          className="px-3 py-1.5 text-xs font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors"
        >
          Remove
        </button>
      )}
    </div>
  );
}