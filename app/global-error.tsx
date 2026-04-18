"use client";

/**
 * Global error boundary — catches errors in the root layout itself.
 * Must render its own <html> and <body> (no parent layout available).
 * Uses inline styles only — CSS may not be loaded at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#fafaf8",
          color: "#0a0a0a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            border: "2px solid #0a0a0a",
            padding: "2.5rem",
            maxWidth: "28rem",
            width: "100%",
          }}
        >
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "0.625rem",
              color: "#e63000",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              marginBottom: "1rem",
            }}
          >
            Critical Application Error
          </p>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              margin: "0 0 1rem",
              lineHeight: 1.1,
            }}
          >
            Failed to Load
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b6b6b",
              lineHeight: 1.6,
              marginBottom: "0.5rem",
            }}
          >
            {error.message || "The application encountered a critical error."}
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "0.625rem",
                color: "#6b6b6b",
                marginBottom: "2rem",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              background: "#0a0a0a",
              color: "#fafaf8",
              border: "none",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
