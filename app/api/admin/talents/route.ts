/**
 * GET /api/admin/talents
 *
 * Admin-only paginated list of all non-deleted talent records.
 * Returns status stats in the `extra` field.
 */
import { NextRequest } from "next/server";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { talentRepository } from "@/repositories";
import { talentListQuerySchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { paginated, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";
import { TalentStatus } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const GET = withErrorHandling(async (request: NextRequest) => {
  await getAuthenticatedAdminOrThrow();

  const { searchParams } = new URL(request.url);
  const rawQuery = {
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    primarySkill: searchParams.get("primarySkill") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    skills: searchParams.get("skills") ?? undefined,
    skillsMatch: searchParams.get("skillsMatch") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDir: searchParams.get("sortDir") ?? undefined,
  };

  const parsed = talentListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const [result, statusCounts] = await Promise.all([
    talentRepository.findMany({
      ...parsed.data,
      status: parsed.data.status as TalentStatus | undefined,
      skills: skillsArray,
    }),
    prisma.talent.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    statusCounts.map((row) => [row.status, row._count.id]),
  ) as Record<string, number>;

  const stats = {
    total: result.total,
    pending: byStatus[TalentStatus.PENDING] ?? 0,
    reviewed: byStatus[TalentStatus.REVIEWED] ?? 0,
    approved: byStatus[TalentStatus.APPROVED] ?? 0,
    rejected: byStatus[TalentStatus.REJECTED] ?? 0,
  };

  return paginated(
    result.data,
    { page: result.page, pageSize: result.pageSize, total: result.total },
    200,
    stats,
  );
});
