/**
 * handleDbError — normalises database / repository-level errors into AppErrors.
 *
 * Call this inside every repository catch block so callers always receive a
 * structured AppError rather than a raw Prisma or unknown error.
 *
 * Flow:
 *   1. AppErrors are re-thrown as-is (already structured).
 *   2. Known Prisma error codes are mapped to the appropriate AppError.
 *   3. Everything else becomes a 500 Internal Error (no internals leaked).
 */
import { AppError } from "./errors";

interface PrismaKnownError {
  code: string;
  meta?: Record<string, unknown>;
}

function isPrismaError(err: unknown): err is PrismaKnownError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as PrismaKnownError).code === "string" &&
    (err as PrismaKnownError).code.startsWith("P")
  );
}

/**
 * @param err   The caught error value.
 * @param resource  Optional resource label used in 404 messages (e.g. "Talent").
 */
export function handleDbError(err: unknown, resource?: string): never {
  // Already a structured app error — rethrow unchanged
  if (err instanceof AppError) throw err;

  // Known Prisma client errors
  if (isPrismaError(err)) {
    switch (err.code) {
      case "P2002":
        throw AppError.conflict("A record with those values already exists");
      case "P2025":
        throw AppError.notFound(resource);
      case "P2003":
        throw AppError.badRequest("Related record not found");
      default:
        throw AppError.internal();
    }
  }

  // Unknown / unexpected error
  throw AppError.internal();
}
