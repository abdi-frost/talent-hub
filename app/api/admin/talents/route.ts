/**
 * GET /api/admin/talents
 *
 * Admin-only paginated list of all non-deleted talent records.
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { talentRepository } from "@/repositories";
import { talentListQuerySchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { paginated, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";
import { TalentStatus } from "@/lib/constants";

export const GET = withErrorHandling(async (request: NextRequest) => {
  await getAuthenticatedAdminOrThrow();

  const { searchParams } = new URL(request.url);
  const rawQuery = {
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    primarySkill: searchParams.get("primarySkill") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  };

  const parsed = talentListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const result = await talentRepository.findMany({
    ...parsed.data,
    status: parsed.data.status as TalentStatus | undefined,
  });

  return paginated(result.data, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  });
});
