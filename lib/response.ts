/**
 * Canonical API response shapes — every route handler returns one of these four.
 *
 * 1. SingleResponse<T>     — one entity
 * 2. PaginatedResponse<T>  — list with pagination metadata
 * 3. SuccessResponse       — action confirmed (no entity returned)
 * 4. ApiErrorResponse      — structured error
 *
 * Builder functions produce a typed NextResponse ready to return from a route handler.
 */
import { NextResponse } from "next/server";
import { AppError } from "./errors";

// ── Types ─────────────────────────────────────────────────────────

export type SingleResponse<T> = {
  data: T;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};

export type SuccessResponse = {
  success: true;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

// ── Builders ──────────────────────────────────────────────────────

/** Wrap a single entity. Default status 200; use 201 for creation. */
export function single<T>(
  data: T,
  status = 200,
): NextResponse<SingleResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/** Wrap a paginated list. Computes totalPages, hasNext, hasPrev. */
export function paginated<T>(
  data: T[],
  meta: { page: number; pageSize: number; total: number },
  status = 200,
): NextResponse<PaginatedResponse<T>> {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize));
  return NextResponse.json(
    {
      data,
      pagination: {
        page: meta.page,
        pageSize: meta.pageSize,
        total: meta.total,
        totalPages,
        hasNext: meta.page < totalPages,
        hasPrev: meta.page > 1,
      },
    },
    { status },
  );
}

/** Confirm a successful action (delete, update without returning entity, etc.). */
export function success(
  message?: string,
  status = 200,
): NextResponse<SuccessResponse> {
  return NextResponse.json(
    { success: true as const, ...(message && { message }) },
    { status },
  );
}

/** Return a structured error response from an AppError. */
export function failure(
  error: AppError,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined && { details: error.details }),
      },
    },
    { status: error.statusCode },
  );
}

/** Return a generic 500 without leaking internals. */
export function internalError(): NextResponse<ApiErrorResponse> {
  return failure(AppError.internal());
}
