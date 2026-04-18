/**
 * StatsRepository — pre-aggregated read queries for public statistics.
 *
 * Only APPROVED, non-deleted talents are counted.
 * No individual records or PII are ever returned from this repository.
 *
 * Every method has its own try/catch — DB errors are normalised to AppErrors
 * before bubbling up, so callers always receive structured errors.
 */
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { handleDbError } from "@/lib/db-error";
import { TalentStatus } from "@/lib/constants";

export const statsRepository = {
  async getPublicStats() {
    try {
      const where = {
        deletedAt: null as null | Date,
        status: TalentStatus.APPROVED,
      };

      const [totalTalents, aggregates] = await Promise.all([
        prisma.talent.count({ where }),
        prisma.talent.findMany({
          where,
          select: { skills: true, yearsOfExperience: true },
        }),
      ]);

      const allSkills = aggregates.flatMap((t: { skills: string[]; yearsOfExperience: number }) => t.skills);
      const uniqueSkills = new Set(allSkills).size;

      const avgExperience =
        totalTalents > 0
          ? Math.round(
              aggregates.reduce(
                (sum: number, t: { skills: string[]; yearsOfExperience: number }) =>
                  sum + t.yearsOfExperience,
                0,
              ) / totalTalents,
            )
          : 0;

      // Tally skill frequencies to find the most common
      const skillFreq: Record<string, number> = {};
      for (const skill of allSkills) {
        skillFreq[skill] = (skillFreq[skill] ?? 0) + 1;
      }
      const topSkill =
        Object.entries(skillFreq).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

      return { totalTalents, uniqueSkills, avgExperience, topSkill };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw handleDbError(err);
    }
  },
};
