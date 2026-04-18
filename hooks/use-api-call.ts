"use client";

/**
 * useApiCall — wraps an async API call, tracks loading state, and automatically
 * pipes ApiClientError to the global error overlay.
 *
 * Usage:
 *   const { execute, loading } = useApiCall();
 *   const data = await execute(() => apiClient.post("/api/talents", payload));
 *   // On success: data is the result
 *   // On ApiClientError: the error overlay shows automatically, returns null
 */
import { useState, useCallback } from "react";
import { ApiClientError } from "@/lib/api-client";
import { useErrorOverlay } from "@/components/providers/error-overlay-provider";

export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const { showError } = useErrorOverlay();

  const execute = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      try {
        const result = await fn();
        return result;
      } catch (err) {
        if (err instanceof ApiClientError) {
          showError(err.errorData);
        } else {
          showError({
            code: "UNKNOWN_ERROR",
            message:
              err instanceof Error
                ? err.message
                : "An unexpected error occurred",
          });
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showError],
  );

  return { execute, loading };
}
