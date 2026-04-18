/**
 * TalentRepository — all Prisma operations for the Talent model.
 *
 * Rules:
 * • Every read filters deletedAt: null (soft-delete contract).
 * • Business logic (auth, audit) belongs in the route handler, not here.
 * • Throws AppError.notFound("Talent") when a record cannot be found.
 * • Every method has its own try/catch — DB errors are normalised to AppErrors
 *   before bubbling up, so callers always receive structured errors.
 */
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { handleDbError } from "@/lib/db-error";
import { TalentStatus } from "@/lib/constants";
import type { Prisma } from "@/generated/prisma/client";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type TalentListFilters = {
  page?: number;
  pageSize?: number;
  /** Filter by lifecycle status */
  status?: TalentStatus;
  /** Exact-match on primarySkill */
  primarySkill?: string;
  /** Full-text search across fullName and email */
  search?: string;
};

export const talentRepository = {
  // ── Create ──────────────────────────────────────────────────────

  async create(data: Prisma.TalentCreateInput) {
    try {
      return await prisma.talent.create({ data });
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  // ── Read ────────────────────────────────────────────────────────

  /** Find one active (non-deleted) talent by id. Throws 404 if missing. */
  async findById(id: string) {
    try {
      const talent = await prisma.talent.findFirst({
        where: { id, deletedAt: null },
      });
      if (!talent) throw AppError.notFound("Talent");
      return talent;
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  /** Find one active talent by email — used for duplicate checks. */
  async findByEmail(email: string) {
    try {
      return await prisma.talent.findFirst({
        where: { email, deletedAt: null },
      });
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  /** Paginated list of active talents with optional filters. */
  async findMany(filters: TalentListFilters = {}) {
    try {
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE),
      );
      const skip = (page - 1) * pageSize;

      const where: Prisma.TalentWhereInput = {
        deletedAt: null,
        ...(filters.status !== undefined && { status: filters.status }),
        ...(filters.primarySkill && { primarySkill: filters.primarySkill }),
        ...(filters.search && {
          OR: [
            { fullName: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }),
      };

      const [data, total] = await Promise.all([
        prisma.talent.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { createdAt: "desc" },
        }),
        prisma.talent.count({ where }),
      ]);

      return { data, total, page, pageSize };
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  // ── Update ──────────────────────────────────────────────────────

  /** Update scalar fields on an active talent. Throws 404 if not found / deleted. */
  async update(id: string, data: Prisma.TalentUpdateInput) {
    try {
      const existing = await prisma.talent.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw AppError.notFound("Talent");
      return await prisma.talent.update({ where: { id }, data });
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  /** Transition the status of an active talent. */
  async updateStatus(id: string, status: TalentStatus) {
    try {
      const existing = await prisma.talent.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw AppError.notFound("Talent");
      return await prisma.talent.update({ where: { id }, data: { status } });
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },

  // ── Delete ──────────────────────────────────────────────────────

  /**
   * Soft-delete: sets deletedAt to now().
   * The record is retained for audit purposes.
   */
  async softDelete(id: string) {
    try {
      const existing = await prisma.talent.findFirst({
        where: { id, deletedAt: null },
      });
      if (!existing) throw AppError.notFound("Talent");
      await prisma.talent.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      throw handleDbError(err, "Talent");
    }
  },
};
