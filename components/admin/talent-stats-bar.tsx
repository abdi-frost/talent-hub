import type { TalentStats } from "@/hooks/use-talent-table";

interface TalentStatsBarProps {
  stats: TalentStats;
}

const STAT_ITEMS = [
  { key: "total" as const, label: "Total", color: "" },
  { key: "pending" as const, label: "Pending", color: "text-[var(--color-muted)]" },
  { key: "reviewed" as const, label: "Reviewed", color: "text-blue-500" },
  { key: "approved" as const, label: "Approved", color: "text-green-600" },
  { key: "rejected" as const, label: "Rejected", color: "text-[var(--color-accent)]" },
];

export function TalentStatsBar({ stats }: TalentStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-0 border border-[var(--color-border-light)] mb-6">
      {STAT_ITEMS.map((item, i) => (
        <div
          key={item.key}
          className={`flex flex-col items-center justify-center px-4 py-3 sm:px-6 ${
            i < STAT_ITEMS.length - 1
              ? "border-b sm:border-b-0 border-r-0 sm:border-r border-[var(--color-border-light)]"
              : ""
          }`}
        >
          <span className={`font-display text-3xl leading-none ${item.color}`}>
            {stats[item.key]}
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-muted)] mt-0.5">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
