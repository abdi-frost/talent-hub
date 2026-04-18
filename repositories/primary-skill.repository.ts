/**
 * PrimarySkillRepository — CRUD for the PrimarySkill lookup table.
 *
 * Primary skills are high-level career-path categories (Frontend, Backend, …).
 * Seeded on first run; admins can add or remove entries.
 * Talent records store the category name as a denormalised String field.
 *
 * Every method has its own try/catch — DB errors are normalised to AppErrors
 * before bubbling up, so callers always receive structured errors.
 */
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { handleDbError } from "@/lib/db-error";

export const primarySkillRepository = {
  /** Return all primary-skill categories sorted alphabetically. */
  async findAll() {
    try {
      return await prisma.primarySkill.findMany({ orderBy: { name: "asc" } });
    } catch (err) {
      throw handleDbError(err, "Primary skill");
    }
  },

  /** Find one by id. Throws 404 if missing. */
  async findById(id: string) {
    try {
      const ps = await prisma.primarySkill.findUnique({ where: { id } });
      if (!ps) throw AppError.notFound("Primary skill");
      return ps;
    } catch (err) {
      throw handleDbError(err, "Primary skill");
    }
  },

  /** Create a new category. Throws conflict on duplicate name. */
  async create(name: string) {
    try {
      return await prisma.primarySkill.create({ data: { name } });
    } catch (err) {
      throw handleDbError(err, "Primary skill");
    }
  },

  /** Rename an existing category. */
  async update(id: string, name: string) {
    try {
      await this.findById(id);
      return await prisma.primarySkill.update({ where: { id }, data: { name } });
    } catch (err) {
      throw handleDbError(err, "Primary skill");
    }
  },

  /** Delete a category. */
  async delete(id: string) {
    try {
      await this.findById(id);
      return await prisma.primarySkill.delete({ where: { id } });
    } catch (err) {
      throw handleDbError(err, "Primary skill");
    }
  },
};
