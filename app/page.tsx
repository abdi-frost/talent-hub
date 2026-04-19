import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* ── Nav ──────────────────────────────────────── */}
      <header className="border-b-2 border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display text-2xl tracking-widest">
            {APP_NAME}
          </span>
          <Link
            href="/admin"
            className="text-sm font-medium border border-[var(--color-border)] px-4 py-2 hover:bg-[var(--color-foreground)] hover:text-[var(--color-background)] transition-colors"
          >
            Admin
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="border-b-2 border-[var(--color-border)] py-24">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
          <div>
            <p className="text-sm font-mono tracking-[0.2em] uppercase text-[var(--color-accent)] mb-4">
              Talent Management
            </p>
            <h1 className="font-display text-7xl md:text-9xl leading-none">
              Find.
              <br />
              Build.
              <br />
              Ship.
            </h1>
          </div>
          <div className="space-y-6">
            <p className="text-lg text-[var(--color-muted)] leading-relaxed">
              Submit your profile and join a curated network of builders,
              engineers, and creators.
            </p>
            <Link
              href="/submit"
              className="inline-block bg-[var(--color-accent)] text-white font-medium px-8 py-4 hover:bg-[var(--color-accent-hover)] transition-colors text-base"
            >
              Submit Your Profile →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats placeholder ────────────────────────── */}
      <section className="py-20 border-b border-[var(--color-border-light)]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-display text-3xl mb-12 tracking-wide">
            Community at a Glance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-[var(--color-border)]">
            {[
              { label: "Total Talents", value: "—" },
              { label: "Unique Skills", value: "—" },
              { label: "Avg. Experience", value: "—" },
              { label: "Top Skill", value: "—" },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-8 border-r border-[var(--color-border)] last:border-r-0"
              >
                <p className="font-display text-5xl text-[var(--color-accent)]">
                  {stat.value}
                </p>
                <p className="text-sm text-[var(--color-muted)] mt-2 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

