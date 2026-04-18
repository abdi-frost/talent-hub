/**
 * AppError — the single structured error type thrown throughout the application.
 *
 * Usage (throwing):
 *   throw AppError.notFound("Talent");
 *   throw AppError.conflict("Email already registered");
 *   throw AppError.validationError(zodIssues);
 *
 * Usage (checking):
 *   if (err instanceof AppError) { ... }
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  // ── Factories ────────────────────────────────────────────────────

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have permission to perform this action") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404, "NOT_FOUND");
  }

  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validationError(details: unknown) {
    return new AppError("Validation failed", 422, "VALIDATION_ERROR", details);
  }

  static internal(message = "An unexpected error occurred") {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
}

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";
