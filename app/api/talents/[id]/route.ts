/**
 * PUT    /api/talents/[id] — admin: update talent fields (including status)
 * DELETE /api/talents/[id] — admin: soft-delete talent record
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { talentRepository } from "@/repositories";
import { talentUpdateSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, success, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(async (request: NextRequest, ctx: Ctx) => {
  await getAuthenticatedAdminOrThrow();
  const { id } = await ctx.params;

  const body = await request.json();
  const parsed = talentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const talent = await talentRepository.update(id, parsed.data);
  return single(talent);
});

export const DELETE = withErrorHandling(
  async (_request: NextRequest, ctx: Ctx) => {
    await getAuthenticatedAdminOrThrow();
    const { id } = await ctx.params;

    await talentRepository.softDelete(id);
    return success("Talent record deleted");
  },
);

