/**
 * withErrorHandling — wraps a Next.js route handler in a try/catch that:
 *
 * • re-throws Next.js internal signals (redirect, not-found) so the framework
 *   can handle them correctly
 * • maps known Prisma errors to AppErrors
 * • maps AppErrors to structured ApiErrorResponse
 * • swallows unknown errors as 500 (without leaking internals)
 *
 * Usage:
 *   export const GET = withErrorHandling(async (req) => {
 *     const data = await prisma.talent.findMany();
 *     return single(data);
 *   });
 */
import { ZodError } from "zod";
import { AppError } from "./errors";
import { failure, internalError } from "./response";

// Next.js encodes redirect / not-found as thrown errors with a `digest` field.
function isNextInternalSignal(err: unknown): boolean {
  return (
    err instanceof Error &&
    typeof (err as unknown as { digest?: string }).digest === "string" &&
    /^NEXT_(REDIRECT|NOT_FOUND)/.test(
      (err as unknown as { digest: string }).digest,
    )
  );
}

interface PrismaKnownError {
  code: string;
  message: string;
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

function mapPrismaError(err: PrismaKnownError): AppError {
  switch (err.code) {
    case "P2002":
      return AppError.conflict("A record with those values already exists");
    case "P2025":
      return AppError.notFound();
    case "P2003":
      return AppError.badRequest("Related record not found");
    default:
      return AppError.internal();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withErrorHandling<Args extends any[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err: unknown) {
      // 1. Let Next.js handle its own signals
      if (isNextInternalSignal(err)) throw err;

      // 2. Known app error
      if (err instanceof AppError) return failure(err);

      // 3. Prisma known error
      if (isPrismaError(err)) return failure(mapPrismaError(err));

      // 4. Zod parse error (thrown via .parse() instead of .safeParse())
      if (err instanceof ZodError) {
        return failure(AppError.validationError(err.flatten()));
      }

      // 5. Unhandled — log on server, return opaque 500
      console.error("[Route Error]", err);
      return internalError();
    }
  };
}
