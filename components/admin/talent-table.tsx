"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { TalentStatus } from "@/lib/constants";
import type { PaginatedResponse, SingleResponse } from "@/lib/response";
import { EditTalentModal } from "./edit-talent-modal";
import { ConfirmDialog } from "./confirm-dialog";

// ── Types ─────────────────────────────────────────────────────────

interface Talent {
  id: string;
  fullName: string;
  email: string;
  primarySkill: string;
  skills: string[];
  yearsOfExperience: number;
  description: string;
  location?: string | null;
  portfolioUrl?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PrimarySkill {
  id: string;
  name: string;
}

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "border-[var(--color-muted)] text-[var(--color-muted)]",
    APPROVED: "border-green-600 text-green-600",
    REJECTED: "border-[var(--color-accent)] text-[var(--color-accent)]",
  };
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-mono uppercase tracking-widest ${
        map[status] ?? "border-[var(--color-border-light)] text-[var(--color-muted)]"
      }`}
    >
      {status}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────

export function TalentTable() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [primarySkillFilter, setPrimarySkillFilter] = useState("");

  const [primarySkills, setPrimarySkills] = useState<PrimarySkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [deletingTalent, setDeletingTalent] = useState<Talent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load primary skills for filter dropdown (once)
  useEffect(() => {
    apiClient
      .get<SingleResponse<PrimarySkill[]>>("/api/primary-skills")
      .then((res) => setPrimarySkills(res.data))
      .catch(() => {}); // non-critical
  }, []);

  const loadTalents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (primarySkillFilter) params.set("primarySkill", primarySkillFilter);

      const res = await apiClient.get<PaginatedResponse<Talent>>(
        `/api/admin/talents?${params.toString()}`,
      );
      setTalents(res.data);
      setTotalCount(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load talent records.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, primarySkillFilter]);

  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilterChange = (key: "status" | "primarySkill", value: string) => {
    setPage(1);
    if (key === "status") setStatusFilter(value);
    else setPrimarySkillFilter(value);
  };

  const handleSaved = (updated: Talent) => {
    setTalents((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    setEditingTalent(null);
  };

  const handleDelete = async () => {
    if (!deletingTalent) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/api/admin/talents/${deletingTalent.id}`);
      setTalents((prev) => prev.filter((t) => t.id !== deletingTalent.id));
      setTotalCount((c) => c - 1);
      setDeletingTalent(null);
    } catch (err) {
      // Keep dialog open, error shown in confirm dialog loading state
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-0 border border-[var(--color-border-light)]">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-1 border-b sm:border-b-0 sm:border-r border-[var(--color-border-light)]"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email or description…"
            className="flex-1 px-4 py-3 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)]"
          />
          <button
            type="submit"
            className="px-5 py-3 text-sm font-medium border-l border-[var(--color-border-light)] hover:bg-[var(--color-muted-bg)] transition-colors whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="flex">
          {/* Status filter */}
          <div className="relative border-r border-[var(--color-border-light)]">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="h-full px-4 py-3 pr-8 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(TalentStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">
              ▾
            </span>
          </div>

          {/* Primary skill filter */}
          <div className="relative">
            <select
              value={primarySkillFilter}
              onChange={(e) => handleFilterChange("primarySkill", e.target.value)}
              className="h-full px-4 py-3 pr-8 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">All Skills</option>
              {primarySkills.map((ps) => (
                <option key={ps.id} value={ps.name}>
                  {ps.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="border border-[var(--color-accent)] px-6 py-4">
          <p className="text-sm font-mono text-[var(--color-accent)]">{error}</p>
          <button
            onClick={loadTalents}
            className="mt-2 text-xs underline text-[var(--color-foreground)]"
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
              <div className="h-4 bg-[var(--color-muted-bg)] flex-1" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-40" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-24" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-20" />
            </div>
          ))}
        </div>
      ) : talents.length === 0 ? (
        <div className="border border-[var(--color-border-light)] px-6 py-16 text-center">
          <p className="font-display text-3xl mb-2">No Records</p>
          <p className="text-sm text-[var(--color-muted)]">
            {search || statusFilter || primarySkillFilter
              ? "No talents match your filters."
              : "No talent submissions yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Table meta */}
          <p className="text-xs font-mono text-[var(--color-muted)] mb-3 uppercase tracking-widest">
            Showing {talents.length} of {totalCount} records
          </p>

          {/* Desktop table */}
          <div className="border border-[var(--color-border-light)] overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-foreground)] text-[var(--color-background)]">
                  {["Name", "Email", "Primary Skill", "Status", "Exp (yrs)", "Submitted", "Actions"].map(
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
                {talents.map((talent) => (
                  <tr
                    key={talent.id}
                    className="hover:bg-[var(--color-muted-bg)] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium whitespace-nowrap border-r border-[var(--color-border-light)]">
                      {talent.fullName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] whitespace-nowrap border-r border-[var(--color-border-light)]">
                      {talent.email}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap border-r border-[var(--color-border-light)]">
                      {talent.primarySkill}
                    </td>
                    <td className="px-5 py-3 border-r border-[var(--color-border-light)]">
                      <StatusBadge status={talent.status} />
                    </td>
                    <td className="px-5 py-3 text-center border-r border-[var(--color-border-light)]">
                      {talent.yearsOfExperience}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] whitespace-nowrap border-r border-[var(--color-border-light)]">
                      {formatDate(talent.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-0 border border-[var(--color-border-light)] w-fit">
                        <button
                          onClick={() => setEditingTalent(talent)}
                          className="px-4 py-1.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingTalent(talent)}
                          className="px-4 py-1.5 text-xs font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border border-[var(--color-border-light)] px-6 py-3">
              <p className="text-xs font-mono text-[var(--color-muted)]">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-0 border border-[var(--color-border)]">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2 text-sm font-medium hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editingTalent && (
        <EditTalentModal
          talent={editingTalent}
          onClose={() => setEditingTalent(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingTalent}
        title="Delete Talent"
        message={
          deletingTalent
            ? `Are you sure you want to delete ${deletingTalent.fullName}'s record? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTalent(null)}
      />
    </>
  );
}
