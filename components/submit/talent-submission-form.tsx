"use client";

import { useState, useEffect, useCallback } from "react";
import { talentSubmissionSchema } from "@/lib/validations";
import { apiClient, ApiClientError } from "@/lib/api-client";
import type { SingleResponse } from "@/lib/response";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────

interface Skill {
  id: string;
  name: string;
}

interface PrimarySkill {
  id: string;
  name: string;
}

type FieldErrors = Partial<Record<string, string[]>>;

// ── Sub-components ────────────────────────────────────────────────

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <p className="mt-1.5 text-xs font-mono text-[var(--color-accent)] leading-snug">
      {messages[0]}
    </p>
  );
}

function Label({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-2"
    >
      {children}
      {required && (
        <span className="ml-1 text-[var(--color-accent)]" aria-hidden>
          *
        </span>
      )}
    </label>
  );
}

function Input({
  id,
  hasError,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  hasError?: boolean;
}) {
  return (
    <input
      id={id}
      {...props}
      className={`w-full border px-4 py-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none transition-colors placeholder:text-[var(--color-muted)] disabled:opacity-50 disabled:cursor-not-allowed ${
        hasError
          ? "border-[var(--color-accent)]"
          : "border-[var(--color-border-light)] focus:border-[var(--color-foreground)]"
      }`}
    />
  );
}

// ── Success state ─────────────────────────────────────────────────

function SuccessState({ name }: { name: string }) {
  return (
    <div className="border-2 border-[var(--color-border)] p-12 text-center">
      <p className="font-mono text-5xl text-[var(--color-accent)] mb-6 select-none">
        ✓
      </p>
      <h2 className="font-display text-5xl mb-4">Profile Submitted</h2>
      <p className="text-[var(--color-muted)] mb-2 max-w-sm mx-auto leading-relaxed">
        Thanks, <strong className="text-[var(--color-foreground)]">{name}</strong>. Your
        profile is under review. We&apos;ll be in touch once it&apos;s been processed.
      </p>
      <div className="mt-10 flex justify-center gap-0 border border-[var(--color-border)] w-fit mx-auto">
        <Link
          href="/"
          className="px-8 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
        >
          ← Back to Home
        </Link>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-8 py-3 text-sm font-medium hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
        >
          Submit Another
        </button>
      </div>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────

export function TalentSubmissionForm() {
  // ── Form values ─────────────────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [primarySkill, setPrimarySkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  // ── UI state ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  // ── Loaded data ──────────────────────────────────────────────────
  const [primarySkills, setPrimarySkills] = useState<PrimarySkill[]>([]);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<SingleResponse<PrimarySkill[]>>("/api/primary-skills"),
      apiClient.get<SingleResponse<Skill[]>>("/api/skills"),
    ])
      .then(([psRes, skRes]) => {
        setPrimarySkills(psRes.data);
        setAvailableSkills(skRes.data);
      })
      .catch(() => {
        setDataError("Failed to load form options. Please refresh the page.");
      })
      .finally(() => setLoadingData(false));
  }, []);

  const toggleSkill = useCallback((name: string) => {
    setSelectedSkills((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      fullName: fullName.trim(),
      email: email.trim(),
      primarySkill,
      skills: selectedSkills,
      yearsOfExperience: yearsOfExperience === "" ? NaN : Number(yearsOfExperience),
      description: description.trim(),
      location: location.trim() || undefined,
      portfolioUrl: portfolioUrl.trim() || "",
    };

    const parsed = talentSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      setErrors({
        ...flat.fieldErrors,
        _root: flat.formErrors.length ? flat.formErrors : undefined,
      });
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-field-error]");
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post("/api/talents", parsed.data);
      setSubmittedName(parsed.data.fullName);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const { code, message, details } = err.errorData;
        if (code === "VALIDATION_ERROR" && details && typeof details === "object") {
          const detailErrors = details as Record<string, { _errors?: string[] }>;
          const mapped: FieldErrors = {};
          for (const [key, val] of Object.entries(detailErrors)) {
            if (val && Array.isArray((val as Record<string, unknown>)._errors)) {
              mapped[key] = (val as { _errors: string[] })._errors;
            }
          }
          setErrors(mapped);
        } else if (code === "CONFLICT") {
          setErrors({ email: [message] });
        } else {
          setErrors({ _root: [message] });
        }
      } else {
        setErrors({ _root: ["An unexpected error occurred. Please try again."] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success ──────────────────────────────────────────────────────
  if (submittedName) {
    return <SuccessState name={submittedName} />;
  }

  // ── Loading / error state for form data ────────────────────────
  if (loadingData) {
    return (
      <div className="border border-[var(--color-border-light)] p-16 text-center">
        <p className="font-mono text-sm text-[var(--color-muted)] uppercase tracking-widest animate-pulse">
          Loading form…
        </p>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="border-2 border-[var(--color-accent)] p-8 text-center">
        <p className="font-mono text-sm text-[var(--color-accent)]">{dataError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline text-[var(--color-foreground)]"
        >
          Refresh page
        </button>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-0">
      {/* Root error banner */}
      {errors._root?.length && (
        <div className="mb-8 border-2 border-[var(--color-accent)] bg-[var(--color-accent)]/5 px-6 py-4">
          <p className="text-sm font-mono text-[var(--color-accent)]">
            {errors._root[0]}
          </p>
        </div>
      )}

      {/* ── Row 1: Name + Email ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border border-[var(--color-border-light)]">
        <div className="p-6 md:border-r border-[var(--color-border-light)]" data-field-error={errors.fullName ? "" : undefined}>
          <Label htmlFor="fullName" required>
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Doe"
            autoComplete="name"
            hasError={!!errors.fullName}
            disabled={isSubmitting}
          />
          <FieldError messages={errors.fullName} />
        </div>
        <div className="p-6 border-t md:border-t-0 border-[var(--color-border-light)]" data-field-error={errors.email ? "" : undefined}>
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. jane@example.com"
            autoComplete="email"
            hasError={!!errors.email}
            disabled={isSubmitting}
          />
          <FieldError messages={errors.email} />
        </div>
      </div>

      {/* ── Row 2: Primary Skill + Years of Experience ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-[var(--color-border-light)]">
        <div className="p-6 md:border-r border-[var(--color-border-light)]" data-field-error={errors.primarySkill ? "" : undefined}>
          <Label htmlFor="primarySkill" required>
            Primary Skill
          </Label>
          <div className="relative">
            <select
              id="primarySkill"
              value={primarySkill}
              onChange={(e) => setPrimarySkill(e.target.value)}
              disabled={isSubmitting}
              className={`w-full border px-4 py-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none transition-colors appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                errors.primarySkill
                  ? "border-[var(--color-accent)]"
                  : "border-[var(--color-border-light)] focus:border-[var(--color-foreground)]"
              }`}
            >
              <option value="">Select a primary skill…</option>
              {primarySkills.map((ps) => (
                <option key={ps.id} value={ps.name}>
                  {ps.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)] select-none">
              ▾
            </span>
          </div>
          <FieldError messages={errors.primarySkill} />
        </div>
        <div className="p-6 border-t md:border-t-0 border-[var(--color-border-light)]" data-field-error={errors.yearsOfExperience ? "" : undefined}>
          <Label htmlFor="yearsOfExperience" required>
            Years of Experience
          </Label>
          <Input
            id="yearsOfExperience"
            type="number"
            min={0}
            max={60}
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            placeholder="e.g. 3"
            hasError={!!errors.yearsOfExperience}
            disabled={isSubmitting}
          />
          <FieldError messages={errors.yearsOfExperience} />
        </div>
      </div>

      {/* ── Row 3: Skills multi-select ───────────────────────────── */}
      <div
        className="border-x border-b border-[var(--color-border-light)]"
        data-field-error={errors.skills ? "" : undefined}
      >
        <div className="p-6 pb-4">
          <div className="flex items-baseline justify-between mb-3">
            <Label htmlFor="skills" required>
              Skills
            </Label>
            {selectedSkills.length > 0 && (
              <span className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest">
                {selectedSkills.length} selected
              </span>
            )}
          </div>
          <FieldError messages={errors.skills} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 border-t border-[var(--color-border-light)] max-h-64 overflow-y-auto">
          {availableSkills.map((skill) => {
            const checked = selectedSkills.includes(skill.name);
            const colBorder =
              "border-r border-[var(--color-border-light)] last:border-r-0";
            return (
              <label
                key={skill.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-colors border-b border-[var(--color-border-light)] ${colBorder} ${
                  checked
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                    : "hover:bg-[var(--color-muted-bg)]"
                } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => !isSubmitting && toggleSkill(skill.name)}
                  disabled={isSubmitting}
                />
                <span
                  className={`w-4 h-4 shrink-0 border flex items-center justify-center text-xs transition-colors ${
                    checked
                      ? "border-[var(--color-background)] bg-[var(--color-accent)]"
                      : "border-[var(--color-border-light)]"
                  }`}
                  aria-hidden
                >
                  {checked && "✓"}
                </span>
                <span className="text-xs font-mono">{skill.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Row 4: Description ───────────────────────────────────── */}
      <div
        className="border-x border-b border-[var(--color-border-light)] p-6"
        data-field-error={errors.description ? "" : undefined}
      >
        <div className="flex items-baseline justify-between mb-2">
          <Label htmlFor="description" required>
            Description
          </Label>
          <span className="text-xs font-mono text-[var(--color-muted)]">
            {description.length}/1000
          </span>
        </div>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell us about your experience, what you build, and what you're looking for…"
          maxLength={1000}
          disabled={isSubmitting}
          className={`w-full border px-4 py-3 bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none transition-colors resize-y placeholder:text-[var(--color-muted)] disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed ${
            errors.description
              ? "border-[var(--color-accent)]"
              : "border-[var(--color-border-light)] focus:border-[var(--color-foreground)]"
          }`}
        />
        <FieldError messages={errors.description} />
      </div>

      {/* ── Row 5: Location + Portfolio URL (optional) ───────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-x border-b border-[var(--color-border-light)]">
        <div className="p-6 md:border-r border-[var(--color-border-light)]">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Berlin, Germany (optional)"
            autoComplete="country-name"
            hasError={!!errors.location}
            disabled={isSubmitting}
          />
          <FieldError messages={errors.location} />
        </div>
        <div className="p-6 border-t md:border-t-0 border-[var(--color-border-light)]">
          <Label htmlFor="portfolioUrl">Portfolio / Website / Github</Label>
          <Input
            id="portfolioUrl"
            type="url"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            placeholder="https://yoursite.com (optional)"
            autoComplete="url"
            hasError={!!errors.portfolioUrl}
            disabled={isSubmitting}
          />
          <FieldError messages={errors.portfolioUrl} />
        </div>
      </div>

      {/* ── Submit row ───────────────────────────────────────────── */}
      <div className="border-x border-b border-[var(--color-border-light)] p-6 flex items-center justify-between gap-6">
        <p className="text-xs text-[var(--color-muted)] font-mono">
          Fields marked{" "}
          <span className="text-[var(--color-accent)]">*</span> are required.
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--color-accent)] text-white font-medium px-10 py-4 text-sm hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSubmitting ? "Submitting…" : "Submit Profile →"}
        </button>
      </div>
    </form>
  );
}
