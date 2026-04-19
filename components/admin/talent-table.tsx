"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useTransition,
} from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { TalentStatus } from "@/lib/constants";
import type { PaginatedResponse, SingleResponse } from "@/lib/response";
import { EditTalentModal } from "./edit-talent-modal";
import { TalentViewModal, type TalentRecord } from "./talent-view-modal";
import { ConfirmDialog } from "./confirm-dialog";

// ── Types ─────────────────────────────────────────────────────────

type Talent = TalentRecord;

interface TalentStats {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
}

interface PrimarySkill {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
}

type SortBy = "createdAt" | "yearsOfExperience" | "fullName" | "status";
type SortDir = "asc" | "desc";
type ViewMode = "pagination" | "infinite";

// ── Constants ─────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ── Status badge ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: "border-[var(--color-muted)] text-[var(--color-muted)]",
    REVIEWED: "border-blue-500 text-blue-500",
    APPROVED: "border-green-600 text-green-600",
    REJECTED: "border-[var(--color-accent)] text-[var(--color-accent)]",
  };
  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-mono uppercase tracking-widest ${
        map[status] ??
        "border-[var(--color-border-light)] text-[var(--color-muted)]"
      }`}
    >
      {status}
    </span>
  );
}

// ── Sort header button ────────────────────────────────────────────

function SortHeader({
  col,
  label,
  sortBy,
  sortDir,
  onSort,
}: {
  col: SortBy;
  label: string;
  sortBy: SortBy;
  sortDir: SortDir;
  onSort: (col: SortBy) => void;
}) {
  const active = sortBy === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="flex items-center gap-1 group whitespace-nowrap"
    >
      {label}
      <span
        className={`text-[10px] transition-opacity ${active ? "opacity-100" : "opacity-0 group-hover:opacity-50"}`}
      >
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: TalentStats }) {
  const items = [
    { label: "Total", value: stats.total, color: "" },
    { label: "Pending", value: stats.pending, color: "text-[var(--color-muted)]" },
    { label: "Reviewed", value: stats.reviewed, color: "text-blue-500" },
    { label: "Approved", value: stats.approved, color: "text-green-600" },
    { label: "Rejected", value: stats.rejected, color: "text-[var(--color-accent)]" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-[var(--color-border-light)] mb-6">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={`flex flex-col items-center justify-center px-6 py-3 ${
            i < items.length - 1 ? "border-r border-[var(--color-border-light)]" : ""
          }`}
        >
          <span className={`font-display text-3xl leading-none ${item.color}`}>
            {item.value}
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mt-0.5">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export function TalentTable() {
  // ── Data state ──────────────────────────────────────────────
  const [talents, setTalents] = useState<Talent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<TalentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ── View mode ────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("pagination");

  // ── Filters ──────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [primarySkillFilter, setPrimarySkillFilter] = useState("");

  // ── Skills filter ─────────────────────────────────────────────
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsMatch, setSkillsMatch] = useState<"all" | "any">("any");
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");

  // ── Sort ─────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Auxiliary data ────────────────────────────────────────────
  const [primarySkills, setPrimarySkills] = useState<PrimarySkill[]>([]);

  // ── Row actions ───────────────────────────────────────────────
  const [viewingTalent, setViewingTalent] = useState<Talent | null>(null);
  const [editingTalent, setEditingTalent] = useState<Talent | null>(null);
  const [deletingTalent, setDeletingTalent] = useState<Talent | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Refs ──────────────────────────────────────────────────────
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Load auxiliary data once ──────────────────────────────────
  useEffect(() => {
    Promise.all([
      apiClient.get<SingleResponse<PrimarySkill[]>>("/api/primary-skills"),
      apiClient.get<SingleResponse<Skill[]>>("/api/skills"),
    ])
      .then(([ps, sk]) => {
        setPrimarySkills(ps.data);
        setAvailableSkills(sk.data);
      })
      .catch(() => {});
  }, []);

  // ── Debounce search input ─────────────────────────────────────
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      startTransition(() => {
        setSearch(searchInput);
        setPage(1);
        if (viewMode === "infinite") setTalents([]);
      });
    }, 500);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // ── Core fetch ────────────────────────────────────────────────
  const fetchTalents = useCallback(
    async (targetPage: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: String(targetPage),
          pageSize: String(PAGE_SIZE),
          sortBy,
          sortDir,
        });
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (primarySkillFilter) params.set("primarySkill", primarySkillFilter);
        if (selectedSkills.length > 0) {
          params.set("skills", selectedSkills.join(","));
          params.set("skillsMatch", skillsMatch);
        }

        const res = await apiClient.get<PaginatedResponse<Talent, TalentStats>>(
          `/api/admin/talents?${params.toString()}`,
        );

        setTalents((prev) => (append ? [...prev, ...res.data] : res.data));
        setTotalCount(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        if ("extra" in res && !append) setStats(res.extra as TalentStats);
      } catch (err) {
        setError(
          err instanceof ApiClientError
            ? err.message
            : "Failed to load talent records.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [search, statusFilter, primarySkillFilter, selectedSkills, skillsMatch, sortBy, sortDir],
  );

  // ── Pagination mode ───────────────────────────────────────────
  useEffect(() => {
    if (viewMode === "pagination") {
      fetchTalents(page, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fetchTalents, viewMode]);

  // ── Infinite scroll mode: reset + fetch page 1 ───────────────
  useEffect(() => {
    if (viewMode === "infinite") {
      setTalents([]);
      setPage(1);
      fetchTalents(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTalents, viewMode]);

  // ── Infinite scroll intersection observer ─────────────────────
  useEffect(() => {
    if (viewMode !== "infinite") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loadingMore &&
          !loading &&
          page < totalPages
        ) {
          const next = page + 1;
          setPage(next);
          fetchTalents(next, true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode, loadingMore, loading, page, totalPages, fetchTalents]);

  // ── Sort handler ──────────────────────────────────────────────
  const handleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("desc"); }
    setPage(1);
    if (viewMode === "infinite") setTalents([]);
  };

  // ── Filter helpers ────────────────────────────────────────────
  const resetPage = () => {
    setPage(1);
    if (viewMode === "infinite") setTalents([]);
  };

  const toggleSkill = (name: string) =>
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );

  const applySkillFilter = () => { setSkillsOpen(false); resetPage(); };
  const clearSkillFilter = () => { setSelectedSkills([]); setSkillsMatch("any"); resetPage(); };

  // ── Row actions ───────────────────────────────────────────────
  const handleStatusChanged = (updated: Talent) => {
    setTalents((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setViewingTalent(updated);
  };

  const handleSaved = (updated: Talent) => {
    setTalents((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
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
    } catch { /* keep dialog open */ }
    finally { setDeleteLoading(false); }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });

  const filteredSkills = availableSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );
  const hasFilters = search || statusFilter || primarySkillFilter || selectedSkills.length > 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* Stats bar */}
      {stats && <StatsBar stats={stats} />}

      {/* ── View mode toggle ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest">
          {totalCount} record{totalCount !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-0 border border-[var(--color-border-light)]">
          {(["pagination", "infinite"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setViewMode(mode); setPage(1); setTalents([]); }}
              className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors border-r last:border-r-0 border-[var(--color-border-light)] ${
                viewMode === mode
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                  : "hover:bg-[var(--color-muted-bg)]"
              }`}
            >
              {mode === "pagination" ? "Paginated" : "Infinite Scroll"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────── */}
      <div className="mb-4 border border-[var(--color-border-light)]">
        <div className="flex flex-col sm:flex-row">
          {/* Live search */}
          <div className="flex-1 border-b sm:border-b-0 sm:border-r border-[var(--color-border-light)]">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email or description…"
              className="w-full px-4 py-3 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>

          <div className="flex flex-wrap">
            {/* Status */}
            <div className="relative border-r border-[var(--color-border-light)]">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
                className="h-full px-4 py-3 pr-8 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {Object.values(TalentStatus).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">▾</span>
            </div>

            {/* Primary skill */}
            <div className="relative border-r border-[var(--color-border-light)]">
              <select
                value={primarySkillFilter}
                onChange={(e) => { setPrimarySkillFilter(e.target.value); resetPage(); }}
                className="h-full px-4 py-3 pr-8 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
              >
                <option value="">All Categories</option>
                {primarySkills.map((ps) => (
                  <option key={ps.id} value={ps.name}>{ps.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">▾</span>
            </div>

            {/* Skills filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setSkillsOpen((s) => !s)}
                className={`h-full px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 hover:bg-[var(--color-muted-bg)] transition-colors ${selectedSkills.length > 0 ? "text-[var(--color-accent)] font-medium" : ""}`}
              >
                Skills
                {selectedSkills.length > 0 && (
                  <span className="bg-[var(--color-accent)] text-white text-[10px] font-mono px-1.5 py-0.5 leading-none">
                    {selectedSkills.length}
                  </span>
                )}
                <span className="text-xs">▾</span>
              </button>

              {skillsOpen && (
                <div className="absolute right-0 top-full z-30 w-80 border-2 border-[var(--color-border)] bg-[var(--color-background)]">
                  {/* Match mode */}
                  <div className="flex border-b border-[var(--color-border-light)]">
                    {(["any", "all"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSkillsMatch(mode)}
                        className={`flex-1 py-2.5 text-xs font-mono uppercase tracking-widest border-r last:border-r-0 border-[var(--color-border-light)] transition-colors ${
                          skillsMatch === mode
                            ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                            : "hover:bg-[var(--color-muted-bg)]"
                        }`}
                      >
                        {mode === "any" ? "Has Any" : "Has All"}
                      </button>
                    ))}
                  </div>
                  {/* Skill search */}
                  <div className="border-b border-[var(--color-border-light)]">
                    <input
                      type="search"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      placeholder="Filter skills…"
                      className="w-full px-3 py-2 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)]"
                    />
                  </div>
                  {/* Skills list */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-[var(--color-border-light)]">
                    {filteredSkills.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-[var(--color-muted)]">No skills found.</p>
                    ) : (
                      filteredSkills.map((skill) => {
                        const checked = selectedSkills.includes(skill.name);
                        return (
                          <label
                            key={skill.id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                              checked
                                ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                                : "hover:bg-[var(--color-muted-bg)]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSkill(skill.name)}
                              className="accent-[var(--color-accent)]"
                            />
                            {skill.name}
                          </label>
                        );
                      })
                    )}
                  </div>
                  {/* Apply / Clear */}
                  <div className="flex border-t border-[var(--color-border-light)]">
                    <button type="button" onClick={clearSkillFilter} className="flex-1 py-2.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-muted-bg)] transition-colors">Clear</button>
                    <button type="button" onClick={applySkillFilter} className="flex-1 py-2.5 text-xs font-mono bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active skill pills */}
        {selectedSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-t border-[var(--color-border-light)]">
            <span className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mr-1">
              {skillsMatch === "all" ? "Has all:" : "Has any:"}
            </span>
            {selectedSkills.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 border border-[var(--color-border)] px-2 py-0.5 text-xs font-mono">
                {s}
                <button
                  type="button"
                  onClick={() => { setSelectedSkills((prev) => prev.filter((x) => x !== s)); resetPage(); }}
                  className="text-[var(--color-muted)] hover:text-[var(--color-accent)] ml-0.5"
                >✕</button>
              </span>
            ))}
            <button type="button" onClick={clearSkillFilter} className="text-xs font-mono text-[var(--color-muted)] underline ml-1">Clear all</button>
          </div>
        )}
      </div>

      {/* ── States ───────────────────────────────────────── */}
      {error ? (
        <div className="border border-[var(--color-accent)] px-6 py-4">
          <p className="text-sm font-mono text-[var(--color-accent)]">{error}</p>
          <button onClick={() => fetchTalents(page, false)} className="mt-2 text-xs underline text-[var(--color-foreground)]">Retry</button>
        </div>
      ) : loading ? (
        <div className="border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-6 py-4 animate-pulse">
              <div className="h-4 bg-[var(--color-muted-bg)] w-6" />
              <div className="h-4 bg-[var(--color-muted-bg)] flex-1" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-40" />
              <div className="h-4 bg-[var(--color-muted-bg)] w-24" />
            </div>
          ))}
        </div>
      ) : talents.length === 0 ? (
        <div className="border border-[var(--color-border-light)] px-6 py-16 text-center">
          <p className="font-display text-3xl mb-2">No Records</p>
          <p className="text-sm text-[var(--color-muted)]">
            {hasFilters ? "No talents match your filters." : "No talent submissions yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-[var(--color-border-light)] overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-foreground)] text-[var(--color-background)]">
                  <th className="text-center px-4 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="fullName" label="Name" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 whitespace-nowrap">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 whitespace-nowrap">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="status" label="Status" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="yearsOfExperience" label="Exp (yrs)" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="createdAt" label="Submitted" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {talents.map((talent, idx) => (
                  <tr
                    key={talent.id}
                    onClick={() => setViewingTalent(talent)}
                    className="hover:bg-[var(--color-muted-bg)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)] text-center border-r border-[var(--color-border-light)]">
                      {viewMode === "pagination" ? (page - 1) * PAGE_SIZE + idx + 1 : idx + 1}
                    </td>
                    <td className="px-5 py-3 font-medium whitespace-nowrap border-r border-[var(--color-border-light)]">{talent.fullName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] whitespace-nowrap border-r border-[var(--color-border-light)]">{talent.email}</td>
                    <td className="px-5 py-3 whitespace-nowrap border-r border-[var(--color-border-light)]">{talent.primarySkill}</td>
                    <td className="px-5 py-3 border-r border-[var(--color-border-light)]"><StatusBadge status={talent.status} /></td>
                    <td className="px-5 py-3 text-center border-r border-[var(--color-border-light)]">{talent.yearsOfExperience}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--color-muted)] whitespace-nowrap border-r border-[var(--color-border-light)]">{formatDate(talent.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div
                        className="flex gap-0 border border-[var(--color-border-light)] w-fit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={(e) => { e.stopPropagation(); setEditingTalent(talent); }} className="px-4 py-1.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors">Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingTalent(talent); }} className="px-4 py-1.5 text-xs font-mono hover:bg-[var(--color-accent)] hover:text-white transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Infinite scroll sentinel */}
          {viewMode === "infinite" && (
            <div ref={sentinelRef} className="mt-4 flex justify-center py-4">
              {loadingMore ? (
                <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest animate-pulse">Loading more…</p>
              ) : page >= totalPages ? (
                <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest">— End of results —</p>
              ) : null}
            </div>
          )}

          {/* Pagination controls */}
          {viewMode === "pagination" && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border border-[var(--color-border-light)] px-6 py-3">
              <p className="text-xs font-mono text-[var(--color-muted)]">
                Page {page} of {totalPages} · {totalCount} records
              </p>
              <div className="flex gap-0 border border-[var(--color-border)]">
                <button onClick={() => setPage(1)} disabled={page === 1} className="px-4 py-2 text-xs font-mono border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40">← Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, i) =>
                    item === "..." ? (
                      <span key={`e${i}`} className="px-3 py-2 text-sm border-r border-[var(--color-border)] text-[var(--color-muted)]">…</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={`px-4 py-2 text-sm border-r border-[var(--color-border)] transition-colors ${page === item ? "bg-[var(--color-foreground)] text-[var(--color-background)]" : "hover:bg-[var(--color-muted-bg)]"}`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40">Next →</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-4 py-2 text-xs font-mono hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40">»</button>
              </div>
            </div>
          )}
        </>
      )}

      {viewingTalent && (
        <TalentViewModal
          talent={viewingTalent}
          onClose={() => setViewingTalent(null)}
          onStatusChanged={handleStatusChanged}
        />
      )}

      {editingTalent && (
        <EditTalentModal talent={editingTalent} onClose={() => setEditingTalent(null)} onSaved={handleSaved} />
      )}

      <ConfirmDialog
        open={!!deletingTalent}
        title="Delete Talent"
        message={deletingTalent ? `Are you sure you want to delete ${deletingTalent.fullName}'s record? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTalent(null)}
      />
    </>
  );
}

