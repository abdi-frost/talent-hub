interface StatusBadgeProps {
  status: string;
}

const STATUS_CLASSES: Record<string, string> = {
  PENDING: "border-[var(--color-muted)] text-[var(--color-muted)]",
  REVIEWED: "border-blue-500 text-blue-500",
  APPROVED: "border-green-600 text-green-600",
  REJECTED: "border-[var(--color-accent)] text-[var(--color-accent)]",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const classes =
    STATUS_CLASSES[status] ??
    "border-[var(--color-border-light)] text-[var(--color-muted)]";

  return (
    <span
      className={`inline-block border px-2 py-0.5 text-xs font-mono uppercase tracking-widest ${classes}`}
    >
      {status}
    </span>
  );
}
