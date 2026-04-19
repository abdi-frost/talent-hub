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
import type { TalentRecord } from "@/components/admin/talent-view-modal";

// ── Types ─────────────────────────────────────────────────────────

export interface TalentStats {
  total: number;
  pending: number;
  reviewed: number;
  approved: number;
  rejected: number;
}

export interface TalentLookups {
  primarySkills: { id: string; name: string }[];
  skills: { id: string; name: string }[];
}

export type SortBy = "createdAt" | "yearsOfExperience" | "fullName" | "status";
export type SortDir = "asc" | "desc";
export type ViewMode = "pagination" | "infinite";

const PAGE_SIZE = 20;

// ── Hook ──────────────────────────────────────────────────────────

export function useTalentTable() {
  // ── Data ──────────────────────────────────────────────────────
  const [talents, setTalents] = useState<TalentRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<TalentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // ── View mode ─────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("pagination");

  // ── Filter state ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [primarySkillFilter, setPrimarySkillFilter] = useState("");

  // ── Skills filter ─────────────────────────────────────────────
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsMatch, setSkillsMatch] = useState<"all" | "any">("any");
  const [skillSearch, setSkillSearch] = useState("");

  // ── Sort ──────────────────────────────────────────────────────
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // ── Lookups ───────────────────────────────────────────────────
  const [lookups, setLookups] = useState<TalentLookups>({
    primarySkills: [],
    skills: [],
  });

  // ── Refs ──────────────────────────────────────────────────────
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Load lookups once ─────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      apiClient.get<SingleResponse<{ id: string; name: string }[]>>("/api/primary-skills"),
      apiClient.get<SingleResponse<{ id: string; name: string }[]>>("/api/skills"),
    ])
      .then(([ps, sk]) =>
        setLookups({ primarySkills: ps.data, skills: sk.data }),
      )
      .catch(() => {});
  }, []);

  // ── Debounce search ───────────────────────────────────────────
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

        const res = await apiClient.get<PaginatedResponse<TalentRecord, TalentStats>>(
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

  // ── Pagination mode re-fetch ──────────────────────────────────
  useEffect(() => {
    if (viewMode === "pagination") fetchTalents(page, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fetchTalents, viewMode]);

  // ── Infinite scroll initial load ──────────────────────────────
  useEffect(() => {
    if (viewMode === "infinite") {
      setTalents([]);
      setPage(1);
      fetchTalents(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchTalents, viewMode]);

  // ── Infinite scroll observer ──────────────────────────────────
  useEffect(() => {
    if (viewMode !== "infinite") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && !loading && page < totalPages) {
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

  // ── Sort ──────────────────────────────────────────────────────
  const handleSort = (col: SortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(1);
    if (viewMode === "infinite") setTalents([]);
  };

  // ── Pagination ────────────────────────────────────────────────
  const handlePageChange = (p: number) => setPage(p);

  // ── Filter helpers ────────────────────────────────────────────
  const resetPage = () => {
    setPage(1);
    if (viewMode === "infinite") setTalents([]);
  };

  const toggleSkill = (name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  };

  const applySkillFilter = () => {
    setSkillsOpen(false);
    resetPage();
  };

  const clearSkillFilter = () => {
    setSelectedSkills([]);
    setSkillsMatch("any");
    resetPage();
  };

  const handleStatusFilterChange = (v: string) => {
    setStatusFilter(v);
    resetPage();
  };

  const handlePrimarySkillFilterChange = (v: string) => {
    setPrimarySkillFilter(v);
    resetPage();
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setPage(1);
    setTalents([]);
  };

  // ── Row mutations ─────────────────────────────────────────────
  const updateTalentInList = (updated: TalentRecord) =>
    setTalents((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));

  const removeTalentFromList = (id: string) => {
    setTalents((prev) => prev.filter((t) => t.id !== id));
    setTotalCount((c) => c - 1);
  };

  const hasFilters =
    !!search || !!statusFilter || !!primarySkillFilter || selectedSkills.length > 0;

  const filteredSkills = lookups.skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  return {
    // Data
    talents,
    stats,
    totalCount,
    page,
    totalPages,
    loading,
    loadingMore,
    error,
    lookups,
    PAGE_SIZE,
    // View mode
    viewMode,
    handleViewModeChange,
    // Filter state
    searchInput,
    setSearchInput,
    statusFilter,
    handleStatusFilterChange,
    primarySkillFilter,
    handlePrimarySkillFilterChange,
    skillsOpen,
    setSkillsOpen,
    selectedSkills,
    skillsMatch,
    setSkillsMatch,
    skillSearch,
    setSkillSearch,
    filteredSkills,
    toggleSkill,
    applySkillFilter,
    clearSkillFilter,
    hasFilters,
    // Sort
    sortBy,
    sortDir,
    handleSort,
    // Pagination
    handlePageChange,
    // Mutations
    fetchTalents,
    updateTalentInList,
    removeTalentFromList,
    // Refs
    sentinelRef,
    // Status values for filter dropdown
    TalentStatus,
  };
}
