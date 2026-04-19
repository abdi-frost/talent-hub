"use client";

import { TalentStatus } from "@/lib/constants";
import type { TalentLookups, ViewMode } from "@/hooks/use-talent-table";

interface TalentFilterBarProps {
  // Search
  searchInput: string;
  onSearchChange: (v: string) => void;
  // Status
  statusFilter: string;
  onStatusChange: (v: string) => void;
  // Primary skill
  primarySkillFilter: string;
  onPrimarySkillChange: (v: string) => void;
  primarySkills: TalentLookups["primarySkills"];
  // Skills panel
  skillsOpen: boolean;
  onSkillsToggle: () => void;
  selectedSkills: string[];
  skillsMatch: "all" | "any";
  onSkillsMatchChange: (v: "all" | "any") => void;
  skillSearch: string;
  onSkillSearchChange: (v: string) => void;
  filteredSkills: TalentLookups["skills"];
  onToggleSkill: (name: string) => void;
  onApplySkills: () => void;
  onClearSkills: () => void;
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  // Global clear
  hasFilters: boolean;
  onClearAll: () => void;
}

export function TalentFilterBar({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  primarySkillFilter,
  onPrimarySkillChange,
  primarySkills,
  skillsOpen,
  onSkillsToggle,
  selectedSkills,
  skillsMatch,
  onSkillsMatchChange,
  skillSearch,
  onSkillSearchChange,
  filteredSkills,
  onToggleSkill,
  onApplySkills,
  onClearSkills,
  viewMode,
  onViewModeChange,
  hasFilters,
  onClearAll,
}: TalentFilterBarProps) {
  return (
    <div className="mb-4 space-y-2">
      {/* Row 1 – search + dropdowns */}
      <div className="flex flex-col sm:flex-row border border-[var(--color-border-light)]">
        {/* Live search */}
        <input
          type="search"
          value={searchInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email or description…"
          className="flex-1 px-4 py-3 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)] border-b sm:border-b-0 sm:border-r border-[var(--color-border-light)]"
        />

        <div className="flex flex-wrap">
          {/* Status */}
          <div className="relative border-r border-[var(--color-border-light)]">
            <select
              value={statusFilter}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-full px-3 py-3 pr-7 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(TalentStatus).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">▾</span>
          </div>

          {/* Primary skill */}
          <div className="relative border-r border-[var(--color-border-light)]">
            <select
              value={primarySkillFilter}
              onChange={(e) => onPrimarySkillChange(e.target.value)}
              className="h-full px-3 py-3 pr-7 text-sm bg-[var(--color-background)] appearance-none focus:outline-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {primarySkills.map((ps) => (
                <option key={ps.id} value={ps.name}>{ps.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-muted)] text-xs">▾</span>
          </div>

          {/* Skills filter toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={onSkillsToggle}
              className={`h-full px-4 py-3 text-sm whitespace-nowrap flex items-center gap-2 hover:bg-[var(--color-muted-bg)] transition-colors border-r border-[var(--color-border-light)] ${
                selectedSkills.length > 0 ? "text-[var(--color-accent)] font-medium" : ""
              }`}
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
              <div className="absolute right-0 top-full z-30 w-72 sm:w-80 border-2 border-[var(--color-border)] bg-[var(--color-background)]">
                {/* Match mode */}
                <div className="flex border-b border-[var(--color-border-light)]">
                  {(["any", "all"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onSkillsMatchChange(mode)}
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
                    onChange={(e) => onSkillSearchChange(e.target.value)}
                    placeholder="Filter skills…"
                    className="w-full px-3 py-2 text-sm bg-[var(--color-background)] focus:outline-none placeholder:text-[var(--color-muted)]"
                  />
                </div>
                {/* Skills list */}
                <div className="max-h-48 overflow-y-auto divide-y divide-[var(--color-border-light)]">
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
                            onChange={() => onToggleSkill(skill.name)}
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
                  <button
                    type="button"
                    onClick={onClearSkills}
                    className="flex-1 py-2.5 text-xs font-mono border-r border-[var(--color-border-light)] hover:bg-[var(--color-muted-bg)] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={onApplySkills}
                    className="flex-1 py-2.5 text-xs font-mono bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex border-r border-[var(--color-border-light)]">
            {(["pagination", "infinite"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-3 text-xs font-mono border-r last:border-r-0 border-[var(--color-border-light)] transition-colors ${
                  viewMode === mode
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                    : "hover:bg-[var(--color-muted-bg)]"
                }`}
                title={mode === "pagination" ? "Paginated" : "Infinite Scroll"}
              >
                {mode === "pagination" ? "Pages" : "Scroll"}
              </button>
            ))}
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <button
              type="button"
              onClick={onClearAll}
              className="px-4 py-3 text-xs font-mono text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-colors whitespace-nowrap"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Active skill pills */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border border-[var(--color-border-light)]">
          <span className="text-xs font-mono text-[var(--color-muted)] uppercase tracking-widest mr-1">
            {skillsMatch === "all" ? "Has all:" : "Has any:"}
          </span>
          {selectedSkills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 border border-[var(--color-border)] px-2 py-0.5 text-xs font-mono"
            >
              {s}
              <button
                type="button"
                onClick={() => { onToggleSkill(s); }}
                className="text-[var(--color-muted)] hover:text-[var(--color-accent)] ml-0.5"
              >
                ✕
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearSkills}
            className="text-xs font-mono text-[var(--color-muted)] underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
