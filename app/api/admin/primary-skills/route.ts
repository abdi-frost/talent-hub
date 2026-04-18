/**
 * GET  /api/admin/primary-skills — list all primary-skill categories
 * POST /api/admin/primary-skills — create a new category
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { primarySkillRepository } from "@/repositories";
import { skillNameSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

export const GET = withErrorHandling(async () => {
  await getAuthenticatedAdminOrThrow();
  const categories = await primarySkillRepository.findAll();
  return single(categories);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await getAuthenticatedAdminOrThrow();

  const body = await request.json();
  const parsed = skillNameSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const category = await primarySkillRepository.create(parsed.data.name);
  return single(category, 201);
});
