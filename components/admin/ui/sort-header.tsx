interface SortHeaderProps<T extends string> {
  col: T;
  label: string;
  sortBy: T;
  sortDir: "asc" | "desc";
  onSort: (col: T) => void;
}

export function SortHeader<T extends string>({
  col,
  label,
  sortBy,
  sortDir,
  onSort,
}: SortHeaderProps<T>) {
  const active = sortBy === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      className="flex items-center gap-1 group whitespace-nowrap"
    >
      {label}
      <span
        className={`text-[10px] transition-opacity ${
          active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`}
      >
        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}
