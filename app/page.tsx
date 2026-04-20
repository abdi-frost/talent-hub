import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { statsRepository } from "@/repositories";

export const revalidate = 300; // revalidate every 5 minutes

export default async function HomePage() {
  let stats: {
    totalTalents: number;
    uniqueSkills: number;
    avgExperience: number;
    topSkill: string | null;
  } | null = null;

  try {
    stats = await statsRepository.getPublicStats();
  } catch {
    // silently degrade — page still renders
  }

  const statItems = [
    {
      label: "Approved Talents",
      value: stats ? String(stats.totalTalents) : "—",
    },
    {
      label: "Unique Skills",
      value: stats ? String(stats.uniqueSkills) : "—",
    },
    {
      label: "Avg. Experience",
      value: stats ? `${stats.avgExperience} yr${stats.avgExperience !== 1 ? "s" : ""}` : "—",
    },
    {
      label: "Top Skill",
      value: stats?.topSkill ?? "—",
    },
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* ── Nav ──────────────────────────────────────── */}
      <header className="border-b-2 border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo href="/" />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
          <div>
            <p className="text-sm font-mono tracking-[0.2em] uppercase text-[var(--color-accent)] mb-4">
              Talent Management
            </p>
            <h1 className="font-display text-5xl sm:text-7xl md:text-9xl leading-none">
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

      {/* ── Stats ────────────────────────────────────── */}
      <section className="py-20 border-b border-[var(--color-border-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="font-display text-3xl mb-12 tracking-wide">
            Community at a Glance
          </h2>
          <div className="grid grid-cols-2 items-center-safe md:grid-cols-4 gap-0 border border-[var(--color-border)]">
            {statItems.map((stat, i) => (
              <div
                key={i}
                className="p-6 sm:p-8 border-b md:border-b-0 border-r border-[var(--color-border)] last:border-r-0 even:border-r-0 md:even:border-r"
              >
                <p className="font-display text-4xl sm:text-5xl text-[var(--color-accent)] leading-none break-words">
                  {stat.value}
                </p>
                <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-2 uppercase tracking-widest">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Made by ─────────────────────────────────── */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]">
            Made by
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <a
              href="https://github.com/abdi-frost"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4 hover:text-[var(--color-accent)] transition-colors"
            >
              github.com/abdi-frost
            </a>
            <a
              href="https://abdimegersa.dev"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline underline-offset-4 hover:text-[var(--color-accent)] transition-colors"
            >
              abdimegersa.dev
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
