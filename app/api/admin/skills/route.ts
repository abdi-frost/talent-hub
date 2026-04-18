/**
 * GET  /api/admin/skills — list all skills
 * POST /api/admin/skills — create a new skill
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { skillRepository } from "@/repositories";
import { skillNameSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

export const GET = withErrorHandling(async () => {
  await getAuthenticatedAdminOrThrow();
  const skills = await skillRepository.findAll();
  return single(skills);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await getAuthenticatedAdminOrThrow();

  const body = await request.json();
  const parsed = skillNameSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const skill = await skillRepository.create(parsed.data.name);
  return single(skill, 201);
});
