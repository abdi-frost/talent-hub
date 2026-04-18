"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { talentUpdateSchema } from "@/lib/validations";
import { TalentStatus } from "@/lib/constants";
import type { SingleResponse } from "@/lib/response";

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

interface Skill {
  id: string;
  name: string;
}

type FieldErrors = Partial<Record<string, string[]>>;

interface Props {
  talent: Talent;
  onClose: () => void;
  onSaved: (updated: Talent) => void;
}

export function EditTalentModal({ talent, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState(talent.fullName);
  const [primarySkill, setPrimarySkill] = useState(talent.primarySkill);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(talent.skills ?? []);
  const [yearsOfExperience, setYearsOfExperience] = useState(
    String(talent.yearsOfExperience),
  );
  const [description, setDescription] = useState(talent.description);
  const [location, setLocation] = useState(talent.location ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(talent.portfolioUrl ?? "");
  const [status, setStatus] = useState<TalentStatus>(talent.status as TalentStatus);

  const [primarySkills, setPrimarySkills] = useState<Skill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<SingleResponse<Skill[]>>("/api/primary-skills"),
      apiClient.get<SingleResponse<Skill[]>>("/api/skills"),
    ])
      .then(([psRes, skRes]) => {
        setPrimarySkills(psRes.data);
        setAvailableSkills(skRes.data);
      })
      .finally(() => setLoadingData(false));
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleSkill = useCallback((name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setRootError(null);

    const payload = {
      fullName: fullName.trim(),
      primarySkill,
      skills: selectedSkills,
      yearsOfExperience: yearsOfExperience === "" ? NaN : Number(yearsOfExperience),
      description: description.trim(),
      location: location.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || "",
      status,
    };

    const parsed = talentUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.put<SingleResponse<Talent>>(
        `/api/admin/talents/${talent.id}`,
        parsed.data,
      );
      onSaved(res.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setRootError(err.message);
      } else {
        setRootError("An unexpected error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-[var(--color-foreground)]/60"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl border-2 border-[var(--color-border)] bg-[var(--color-background)]">
        {/* Header */}
        <div className="border-b border-[var(--color-border-light)] px-8 py-6 flex items-start justify-between">
          <div>
            <h2 id="edit-modal-title" className="font-display text-4xl">
              Edit Talent
            </h2>
            <p className="text-xs font-mono text-[var(--color-muted)] mt-1">
              {talent.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] text-2xl leading-none mt-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {loadingData ? (
          <div className="px-8 py-16 text-center">
            <p className="font-mono text-sm text-[var(--color-muted)] animate-pulse uppercase tracking-widest">
              Loading…
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} noValidate>
            {rootError && (
              <div className="mx-8 mt-6 border border-[var(--color-accent)] px-4 py-3">
                <p className="text-sm font-mono text-[var(--color-accent)]">
                  {rootError}
                </p>
              </div>
            )}

            <div className="p-8 space-y-0">
              {/* Row: Full Name + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 border border-[var(--color-border-light)]">
                <div className="p-5 md:border-r border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Full Name <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={saving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs font-mono text-[var(--color-accent)]">
                      {errors.fullName[0]}
                    </p>
                  )}
                </div>
                <div className="p-5 border-t md:border-t-0 border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Status <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TalentStatus)}
                      disabled={saving}
                      className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] appearance-none focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50 cursor-pointer"
                    >
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
                </div>
              </div>

              {/* Row: Primary Skill + Years */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-[var(--color-border-light)]">
                <div className="p-5 md:border-r border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Primary Skill <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={primarySkill}
                      onChange={(e) => setPrimarySkill(e.target.value)}
                      disabled={saving}
                      className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] appearance-none focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Select…</option>
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
                  {errors.primarySkill && (
                    <p className="mt-1 text-xs font-mono text-[var(--color-accent)]">
                      {errors.primarySkill[0]}
                    </p>
                  )}
                </div>
                <div className="p-5 border-t md:border-t-0 border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Years of Experience <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    disabled={saving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                  {errors.yearsOfExperience && (
                    <p className="mt-1 text-xs font-mono text-[var(--color-accent)]">
                      {errors.yearsOfExperience[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills grid */}
              <div className="border-x border-b border-[var(--color-border-light)]">
                <div className="px-5 pt-5 pb-3 flex items-baseline justify-between">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">
                    Skills <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  {selectedSkills.length > 0 && (
                    <span className="text-xs font-mono text-[var(--color-accent)]">
                      {selectedSkills.length} selected
                    </span>
                  )}
                </div>
                {errors.skills && (
                  <p className="px-5 text-xs font-mono text-[var(--color-accent)] pb-2">
                    {errors.skills[0]}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-[var(--color-border-light)] max-h-48 overflow-y-auto">
                  {availableSkills.map((skill) => {
                    const checked = selectedSkills.includes(skill.name);
                    return (
                      <label
                        key={skill.id}
                        className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer select-none border-b border-r border-[var(--color-border-light)] text-xs font-mono transition-colors ${
                          checked
                            ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                            : "hover:bg-[var(--color-muted-bg)]"
                        } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => !saving && toggleSkill(skill.name)}
                          disabled={saving}
                        />
                        <span
                          className={`w-3.5 h-3.5 shrink-0 border flex items-center justify-center text-[10px] ${
                            checked
                              ? "border-[var(--color-background)] bg-[var(--color-accent)]"
                              : "border-[var(--color-border-light)]"
                          }`}
                          aria-hidden
                        >
                          {checked && "✓"}
                        </span>
                        {skill.name}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div className="border-x border-b border-[var(--color-border-light)] p-5">
                <div className="flex items-baseline justify-between mb-2">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)]">
                    Description <span className="text-[var(--color-accent)]">*</span>
                  </label>
                  <span className="text-xs font-mono text-[var(--color-muted)]">
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={1000}
                  disabled={saving}
                  className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors resize-y disabled:opacity-50 leading-relaxed"
                />
                {errors.description && (
                  <p className="mt-1 text-xs font-mono text-[var(--color-accent)]">
                    {errors.description[0]}
                  </p>
                )}
              </div>

              {/* Location + Portfolio */}
              <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-[var(--color-border-light)]">
                <div className="p-5 md:border-r border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={saving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                </div>
                <div className="p-5 border-t md:border-t-0 border-[var(--color-border-light)]">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
                    Portfolio / Website
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    disabled={saving}
                    className="w-full border border-[var(--color-border-light)] px-3 py-2.5 text-sm bg-[var(--color-background)] focus:outline-none focus:border-[var(--color-foreground)] transition-colors disabled:opacity-50"
                  />
                  {errors.portfolioUrl && (
                    <p className="mt-1 text-xs font-mono text-[var(--color-accent)]">
                      {errors.portfolioUrl[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[var(--color-border-light)] px-8 py-5 flex justify-end gap-0">
              <div className="flex border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save Changes →"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
