/**
 * PUT    /api/admin/primary-skills/[id] — rename a category
 * DELETE /api/admin/primary-skills/[id] — remove a category
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { primarySkillRepository } from "@/repositories";
import { skillNameSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, success, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = withErrorHandling(async (request: NextRequest, ctx: Ctx) => {
  await getAuthenticatedAdminOrThrow();
  const { id } = await ctx.params;

  const body = await request.json();
  const parsed = skillNameSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const category = await primarySkillRepository.update(id, parsed.data.name);
  return single(category);
});

export const DELETE = withErrorHandling(
  async (_request: NextRequest, ctx: Ctx) => {
    await getAuthenticatedAdminOrThrow();
    const { id } = await ctx.params;

    await primarySkillRepository.delete(id);
    return success("Primary skill deleted");
  },
);
