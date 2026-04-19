"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pageItems = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
      acc.push(p);
      return acc;
    }, []);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[var(--color-border-light)] px-4 sm:px-6 py-3">
      <p className="text-xs font-mono text-[var(--color-muted)]">
        Page {page} of {totalPages} · {totalCount} records
      </p>
      <div className="flex gap-0 border border-[var(--color-border)] overflow-x-auto">
        <button
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className="px-3 sm:px-4 py-2 text-xs font-mono border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
        >
          «
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-3 sm:px-5 py-2 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
        >
          ←
        </button>
        {pageItems.map((item, i) =>
          item === "..." ? (
            <span
              key={`e${i}`}
              className="px-3 py-2 text-sm border-r border-[var(--color-border)] text-[var(--color-muted)]"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              onClick={() => onPageChange(item as number)}
              className={`px-3 sm:px-4 py-2 text-sm border-r border-[var(--color-border)] transition-colors ${
                page === item
                  ? "bg-[var(--color-foreground)] text-[var(--color-background)]"
                  : "hover:bg-[var(--color-muted-bg)]"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-3 sm:px-5 py-2 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
        >
          →
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className="px-3 sm:px-4 py-2 text-xs font-mono hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-40"
        >
          »
        </button>
      </div>
    </div>
  );
}
