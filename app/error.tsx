"use client";

/**
 * Error boundary for route segments.
 * Catches unexpected runtime errors thrown inside the nearest layout/page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8 min-h-[60vh]">
      <div className="border-2 border-[var(--color-border)] p-10 max-w-md w-full">
        <p className="font-mono text-[10px] text-[var(--color-accent)] uppercase tracking-[0.2em] mb-4">
          Unexpected Error
        </p>
        <h2 className="font-display text-4xl mb-4">Something went wrong</h2>
        <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-2">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {error.digest && (
          <p className="font-mono text-[10px] text-[var(--color-muted)] mb-8">
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="bg-[var(--color-foreground)] text-[var(--color-background)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-accent)] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
