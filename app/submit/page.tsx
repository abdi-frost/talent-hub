import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { TalentSubmissionForm } from "@/components/submit/talent-submission-form";

export const metadata: Metadata = {
  title: "Submit Your Profile",
  description: "Join the Talent Hub network by submitting your profile.",
};

export default function SubmitPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* ── Nav ──────────────────────────────────────── */}
      <header className="border-b-2 border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo href="/" />
          <Link
            href="/admin/login"
            className="text-sm font-medium border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* ── Page header ──────────────────────────────── */}
      <section className="border-b-2 border-[var(--color-border)] py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
          <div>
            <p className="text-xs font-mono tracking-[0.2em] uppercase text-[var(--color-muted)] mb-4">
              <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">
                Home
              </Link>
              {" / "}
              <span className="text-[var(--color-foreground)]">Submit</span>
            </p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-9xl leading-none">
              Submit.
            </h1>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-[var(--color-muted)] leading-relaxed">
              Fill in your profile below and join a curated network of builders,
              engineers, and creators. All submissions are reviewed before
              appearing in the directory.
            </p>
            <ul className="space-y-2 text-sm font-mono text-[var(--color-muted)]">
              {[
                "Complete all required fields",
                "Select your skills from the predefined list",
                "Await review — we'll reach out via email",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[var(--color-accent)] shrink-0 font-display text-lg leading-none mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────── */}
      <section className="py-16 flex-1">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16">
            {/* Sidebar */}
            <aside className="space-y-8">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mb-3">
                  What to include
                </p>
                <ul className="space-y-3 text-sm text-[var(--color-muted)] leading-relaxed">
                  <li>
                    <strong className="text-[var(--color-foreground)] font-medium">Full Name</strong>
                    {" — "}Your legal or professional name.
                  </li>
                  <li>
                    <strong className="text-[var(--color-foreground)] font-medium">Email</strong>
                    {" — "}A valid address for follow-ups.
                  </li>
                  <li>
                    <strong className="text-[var(--color-foreground)] font-medium">Primary Skill</strong>
                    {" — "}Your main technical path.
                  </li>
                  <li>
                    <strong className="text-[var(--color-foreground)] font-medium">Skills</strong>
                    {" — "}All tools and technologies you work with.
                  </li>
                  <li>
                    <strong className="text-[var(--color-foreground)] font-medium">Description</strong>
                    {" — "}Brief bio and what you're looking for.
                  </li>
                </ul>
              </div>
              <div className="border border-[var(--color-border-light)] p-5">
                <p className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] mb-2">
                  Privacy
                </p>
                <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Your email address is never displayed publicly. Only
                  administrators can access individual records.
                </p>
              </div>
            </aside>

            {/* Form */}
            <div>
              <TalentSubmissionForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
