/**
 * PUT    /api/admin/skills/[id] — rename a skill
 * DELETE /api/admin/skills/[id] — remove a skill
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { skillRepository } from "@/repositories";
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

  const skill = await skillRepository.update(id, parsed.data.name);
  return single(skill);
});

export const DELETE = withErrorHandling(
  async (_request: NextRequest, ctx: Ctx) => {
    await getAuthenticatedAdminOrThrow();
    const { id } = await ctx.params;

    await skillRepository.delete(id);
    return success("Skill deleted");
  },
);
