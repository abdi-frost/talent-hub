"use client";

/**
 * ErrorOverlayProvider — global API error overlay system.
 *
 * Provides:
 *  • ErrorOverlayContext  — React context
 *  • ErrorOverlayProvider — wrap the app with this in layout.tsx
 *  • useErrorOverlay()    — hook to push errors from anywhere
 *
 * The overlay renders a fixed stack of error cards (bottom-right).
 * Each card auto-dismisses after 8 s and can be closed manually.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ApiErrorResponse } from "@/lib/response";

type ErrorEntry = ApiErrorResponse["error"] & { id: string };

interface ErrorOverlayContextValue {
  showError: (error: ApiErrorResponse["error"]) => void;
}

const ErrorOverlayContext = createContext<ErrorOverlayContextValue>({
  showError: () => {},
});

export function useErrorOverlay() {
  return useContext(ErrorOverlayContext);
}

// ── Auto-dismiss timer per error ──────────────────────────────────
const AUTO_DISMISS_MS = 8000;

export function ErrorOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const showError = useCallback(
    (error: ApiErrorResponse["error"]) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setErrors((prev) => [...prev, { ...error, id }]);
      const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  // Clean up all timers on unmount
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <ErrorOverlayContext.Provider value={{ showError }}>
      {children}
      <ErrorOverlay errors={errors} onDismiss={dismiss} />
    </ErrorOverlayContext.Provider>
  );
}

// ── Overlay UI ─────────────────────────────────────────────────────
function ErrorOverlay({
  errors,
  onDismiss,
}: {
  errors: ErrorEntry[];
  onDismiss: (id: string) => void;
}) {
  if (errors.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 w-full max-w-sm pointer-events-none"
    >
      {errors.map((err) => (
        <ErrorCard key={err.id} error={err} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ErrorCard({
  error,
  onDismiss,
}: {
  error: ErrorEntry;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-auto bg-[var(--color-background)] border-2 border-[var(--color-accent)] p-4 w-full"
      style={{ animation: "slideIn 0.18s ease-out" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <span className="font-mono text-[10px] font-medium text-[var(--color-accent)] uppercase tracking-[0.18em] leading-none pt-0.5">
          {error.code.replace(/_/g, " ")}
        </span>
        <button
          onClick={() => onDismiss(error.id)}
          aria-label="Dismiss error"
          className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] leading-none text-base shrink-0 -mt-0.5 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Message */}
      <p className="text-sm text-[var(--color-foreground)] leading-snug">
        {error.message}
      </p>

      {/* Progress bar */}
      <div className="mt-3 h-px bg-[var(--color-border-light)] overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)]"
          style={{ animation: "shrinkBar 8s linear forwards" }}
        />
      </div>
    </div>
  );
}
