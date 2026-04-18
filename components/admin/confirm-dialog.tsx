"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--color-foreground)]/60"
        onClick={onCancel}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm border-2 border-[var(--color-border)] bg-[var(--color-background)] p-8">
        <h2
          id="confirm-title"
          className="font-display text-3xl mb-3"
        >
          {title}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-8 leading-relaxed">
          {message}
        </p>
        <div className="flex gap-0 border border-[var(--color-border)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 text-sm font-medium border-r border-[var(--color-border)] hover:bg-[var(--color-muted-bg)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${
              danger
                ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                : "bg-[var(--color-foreground)] text-[var(--color-background)] hover:opacity-80"
            }`}
          >
            {loading ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
