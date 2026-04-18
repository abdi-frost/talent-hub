/**
 * GET    /api/admin/talents/[id] — fetch single talent
 * PUT    /api/admin/talents/[id] — update talent fields / status
 * DELETE /api/admin/talents/[id] — soft-delete talent
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { talentRepository } from "@/repositories";
import { talentUpdateSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, success, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";
import { TalentStatus } from "@/lib/constants";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_req: NextRequest, ctx: Ctx) => {
  await getAuthenticatedAdminOrThrow();
  const { id } = await ctx.params;
  const talent = await talentRepository.findById(id);
  return single(talent);
});

export const PUT = withErrorHandling(async (request: NextRequest, ctx: Ctx) => {
  await getAuthenticatedAdminOrThrow();
  const { id } = await ctx.params;

  const body = await request.json();
  const parsed = talentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const { status, ...rest } = parsed.data;
  const talent = await talentRepository.update(id, {
    ...rest,
    ...(status !== undefined && { status: status as TalentStatus }),
  });
  return single(talent);
});

export const DELETE = withErrorHandling(
  async (_request: NextRequest, ctx: Ctx) => {
    await getAuthenticatedAdminOrThrow();
    const { id } = await ctx.params;
    await talentRepository.softDelete(id);
    return success("Talent deleted");
  },
);
