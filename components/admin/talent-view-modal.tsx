"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { TalentStatus } from "@/lib/constants";
import type { SingleResponse } from "@/lib/response";

// ── Types ─────────────────────────────────────────────────────────

export interface TalentRecord {
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

interface Props {
  talent: TalentRecord;
  onClose: () => void;
  onStatusChanged: (updated: TalentRecord) => void;
}

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
        map[status] ?? "border-[var(--color-border-light)] text-[var(--color-muted)]"
      }`}
    >
      {status}
    </span>
  );
}

// ── Modal ─────────────────────────────────────────────────────────

export function TalentViewModal({ talent, onClose, onStatusChanged }: Props) {
  const [status, setStatus] = useState(talent.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const isDirty = status !== talent.status;

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiClient.put<SingleResponse<TalentRecord>>(
        `/api/admin/talents/${talent.id}`,
        { status },
      );
      onStatusChanged(res.data);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : "Failed to update status.",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Talent profile: ${talent.fullName}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--color-foreground)]/40"
        onClick={onClose}
        aria-hidden
      />

      {/* Slide-in panel */}
      <div className="relative z-10 h-full w-full max-w-lg bg-[var(--color-background)] border-l-2 border-[var(--color-border)] flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-[var(--color-border-light)] shrink-0">
          <div>
            <h2 className="font-display text-4xl leading-none">{talent.fullName}</h2>
            <p className="text-xs font-mono text-[var(--color-muted)] mt-1 uppercase tracking-widest">
              {talent.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-8 py-6 space-y-6">
          {/* Meta row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
                Primary Skill
              </p>
              <p className="text-sm font-medium">{talent.primarySkill}</p>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
                Experience
              </p>
              <p className="text-sm font-medium">
                {talent.yearsOfExperience} yr{talent.yearsOfExperience !== 1 ? "s" : ""}
              </p>
            </div>
            {talent.location && (
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
                  Location
                </p>
                <p className="text-sm">{talent.location}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
                Submitted
              </p>
              <p className="text-sm font-mono">{formatDate(talent.createdAt)}</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
              Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {talent.skills.map((s) => (
                <span
                  key={s}
                  className="border border-[var(--color-border-light)] px-2.5 py-1 text-xs font-mono"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2">
              About
            </p>
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
              {talent.description}
            </p>
          </div>

          {/* Portfolio */}
          {talent.portfolioUrl && (
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-1">
                Portfolio / URL
              </p>
              <a
                href={talent.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-mono underline hover:text-[var(--color-accent)] break-all"
              >
                {talent.portfolioUrl}
              </a>
            </div>
          )}

          {/* ── Status update ──────────────────────────────────── */}
          <div className="border-t border-[var(--color-border-light)] pt-6">
            <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-3">
              Update Status
            </p>

            {error && (
              <p className="text-xs font-mono text-[var(--color-accent)] mb-3">
                {error}
              </p>
            )}
            {saved && (
              <p className="text-xs font-mono text-green-600 mb-3">
                ✓ Status updated to {status}
              </p>
            )}

            {/* Status buttons */}
            <div className="grid grid-cols-2 gap-2">
              {Object.values(TalentStatus).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setStatus(s); setSaved(false); }}
                  className={`py-2.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
                    status === s
                      ? "bg-[var(--color-foreground)] text-[var(--color-background)] border-[var(--color-foreground)]"
                      : "border-[var(--color-border-light)] hover:border-[var(--color-foreground)] hover:bg-[var(--color-muted-bg)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs font-mono text-[var(--color-muted)]">
                Current: <StatusBadge status={talent.status} />
              </span>
              {isDirty && (
                <span className="text-xs font-mono text-[var(--color-muted)]">
                  → <StatusBadge status={status} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-8 py-5 border-t border-[var(--color-border-light)] flex gap-0 border border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex-1 py-3 text-sm font-medium bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save Status →"}
          </button>
        </div>
      </div>
    </div>
  );
}
