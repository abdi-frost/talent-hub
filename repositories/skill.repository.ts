/**
 * SkillRepository — CRUD for the Skill lookup table.
 *
 * Skills are the canonical list of individual technologies / competencies.
 * Seeded on first run; admins can add, rename, or remove entries.
 * Talent records store skill names as a denormalised String[] for simplicity.
 *
 * Every method has its own try/catch — DB errors are normalised to AppErrors
 * before bubbling up, so callers always receive structured errors.
 */
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { handleDbError } from "@/lib/db-error";

export const skillRepository = {
  /** Return all skills sorted alphabetically. */
  async findAll() {
    try {
      return await prisma.skill.findMany({ orderBy: { name: "asc" } });
    } catch (err) {
      throw handleDbError(err, "Skill");
    }
  },

  /** Find one skill by id. Throws 404 if missing. */
  async findById(id: string) {
    try {
      const skill = await prisma.skill.findUnique({ where: { id } });
      if (!skill) throw AppError.notFound("Skill");
      return skill;
    } catch (err) {
      throw handleDbError(err, "Skill");
    }
  },

  /** Create a new skill. Throws conflict on duplicate name. */
  async create(name: string) {
    try {
      return await prisma.skill.create({ data: { name } });
    } catch (err) {
      throw handleDbError(err, "Skill");
    }
  },

  /** Rename an existing skill. Throws 404 if not found. */
  async update(id: string, name: string) {
    try {
      await this.findById(id); // throws 404 early
      return await prisma.skill.update({ where: { id }, data: { name } });
    } catch (err) {
      throw handleDbError(err, "Skill");
    }
  },

  /** Delete a skill entry. Throws 404 if not found. */
  async delete(id: string) {
    try {
      await this.findById(id);
      return await prisma.skill.delete({ where: { id } });
    } catch (err) {
      throw handleDbError(err, "Skill");
    }
  },
};
