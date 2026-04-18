/**
 * GET /api/talents  — public aggregated stats (no PII)
 * POST /api/talents — public talent submission
 */
import { NextRequest } from "next/server";
import { statsRepository, talentRepository } from "@/repositories";
import { talentSubmissionSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

// ── GET /api/talents — public aggregated stats ─────────────────────
export const GET = withErrorHandling(async () => {
  const stats = await statsRepository.getPublicStats();
  return single(stats);
});

// ── POST /api/talents — public talent submission ───────────────────
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = talentSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const talent = await talentRepository.create(parsed.data);
  return single(talent, 201);
});

