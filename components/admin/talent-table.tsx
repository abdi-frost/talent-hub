"use client";

import { useState } from "react";
import { useTalentTable } from "@/hooks/use-talent-table";
import { TalentStatsBar } from "./talent-stats-bar";
import { TalentFilterBar } from "./talent-filter-bar";
import { StatusBadge } from "./ui/status-badge";
import { SortHeader } from "./ui/sort-header";
import { Pagination } from "./ui/pagination";
import { EditTalentModal } from "./edit-talent-modal";
import { TalentViewModal, type TalentRecord } from "./talent-view-modal";

const PAGE_SIZE = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function TalentTable() {
  const table = useTalentTable();

  // Modal state stays local (purely UI)
  const [viewingTalent, setViewingTalent] = useState<TalentRecord | null>(null);
  const [editingTalent, setEditingTalent] = useState<TalentRecord | null>(null);

  const handleStatusChanged = (updated: TalentRecord) => {
    table.updateTalentInList(updated);
    setViewingTalent(updated);
  };

  const handleSaved = (updated: TalentRecord) => {
    table.updateTalentInList(updated);
    setEditingTalent(null);
  };

  const handleDeleted = (id: string) => {
    table.removeTalentFromList(id);
  };

  const clearAllFilters = () => {
    table.setSearchInput("");
    table.handleStatusFilterChange("");
    table.handlePrimarySkillFilterChange("");
    table.clearSkillFilter();
  };

  return (
    <>
      {/* Stats bar */}
      {table.stats && <TalentStatsBar stats={table.stats} />}

      {/* Record count */}
      <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mb-3">
        {table.totalCount} record{table.totalCount !== 1 ? "s" : ""}
      </p>

      {/* Filter bar */}
      <TalentFilterBar
        searchInput={table.searchInput}
        onSearchChange={table.setSearchInput}
        statusFilter={table.statusFilter}
        onStatusChange={table.handleStatusFilterChange}
        primarySkillFilter={table.primarySkillFilter}
        onPrimarySkillChange={table.handlePrimarySkillFilterChange}
        primarySkills={table.lookups.primarySkills}
        skillsOpen={table.skillsOpen}
        onSkillsToggle={() => table.setSkillsOpen((s) => !s)}
        selectedSkills={table.selectedSkills}
        skillsMatch={table.skillsMatch}
        onSkillsMatchChange={table.setSkillsMatch}
        skillSearch={table.skillSearch}
        onSkillSearchChange={table.setSkillSearch}
        filteredSkills={table.filteredSkills}
        onToggleSkill={table.toggleSkill}
        onApplySkills={table.applySkillFilter}
        onClearSkills={table.clearSkillFilter}
        viewMode={table.viewMode}
        onViewModeChange={table.handleViewModeChange}
        hasFilters={table.hasFilters}
        onClearAll={clearAllFilters}
      />

      {/* ── States ──────────────────────────────────────── */}
      {table.error ? (
        <div className="border border-[var(--color-accent)] px-6 py-4">
          <p className="text-sm font-mono text-[var(--color-accent)]">{table.error}</p>
          <button
            onClick={() => table.fetchTalents(table.page, false)}
            className="mt-2 text-xs underline text-[var(--color-foreground)]"
          >
            Retry
          </button>
        </div>
      ) : table.loading ? (
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
      ) : table.talents.length === 0 ? (
        <div className="border border-[var(--color-border-light)] px-6 py-16 text-center">
          <p className="font-display text-3xl mb-2">No Records</p>
          <p className="text-sm text-[var(--color-muted)]">
            {table.hasFilters ? "No talents match your filters." : "No talent submissions yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border border-[var(--color-border-light)] overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--color-foreground)] text-[var(--color-background)]">
                  <th className="text-center px-4 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 w-12">
                    #
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="fullName" label="Name" sortBy={table.sortBy} sortDir={table.sortDir} onSort={table.handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 whitespace-nowrap">
                    Email
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20 whitespace-nowrap">
                    Category
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="status" label="Status" sortBy={table.sortBy} sortDir={table.sortDir} onSort={table.handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="yearsOfExperience" label="Exp (yrs)" sortBy={table.sortBy} sortDir={table.sortDir} onSort={table.handleSort} />
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-mono uppercase tracking-widest border-r border-[var(--color-background)]/20">
                    <SortHeader col="createdAt" label="Submitted" sortBy={table.sortBy} sortDir={table.sortDir} onSort={table.handleSort} />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-light)]">
                {table.talents.map((talent, idx) => (
                  <tr
                    key={talent.id}
                    onClick={() => setViewingTalent(talent)}
                    className="hover:bg-[var(--color-muted-bg)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted)] text-center border-r border-[var(--color-border-light)]">
                      {table.viewMode === "pagination"
                        ? (table.page - 1) * PAGE_SIZE + idx + 1
                        : idx + 1}
                    </td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Infinite scroll sentinel */}
          {table.viewMode === "infinite" && (
            <div ref={table.sentinelRef} className="mt-4 flex justify-center py-4">
              {table.loadingMore ? (
                <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest animate-pulse">
                  Loading more…
                </p>
              ) : table.page >= table.totalPages ? (
                <p className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest">
                  — End of results —
                </p>
              ) : null}
            </div>
          )}

          {/* Pagination controls */}
          {table.viewMode === "pagination" && (
            <Pagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              onPageChange={table.handlePageChange}
            />
          )}
        </>
      )}

      {viewingTalent && (
        <TalentViewModal
          talent={viewingTalent}
          onClose={() => setViewingTalent(null)}
          onStatusChanged={handleStatusChanged}
          onDeleted={handleDeleted}
        />
      )}

      {editingTalent && (
        <EditTalentModal
          talent={editingTalent}
          onClose={() => setEditingTalent(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

