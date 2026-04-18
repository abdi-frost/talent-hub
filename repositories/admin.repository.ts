/**
 * AdminRepository — all Prisma operations for the Admin model.
 *
 * Every method has its own try/catch — DB errors are normalised to AppErrors
 * before bubbling up, so callers always receive structured errors.
 */
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { handleDbError } from "@/lib/db-error";

export const adminRepository = {
  // ── Auth ────────────────────────────────────────────────────────

  /** Find an admin by username — used during authentication. Returns null if missing. */
  async findByUsername(username: string) {
    try {
      return await prisma.admin.findUnique({ where: { username } });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Find an admin by id. Throws 404 if not found. */
  async findById(id: string) {
    try {
      const admin = await prisma.admin.findUnique({ where: { id } });
      if (!admin) throw AppError.notFound("Admin");
      return admin;
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Record the last-login timestamp after a successful login. */
  async updateLastLogin(id: string) {
    try {
      return await prisma.admin.update({
        where: { id },
        data: { lastLoginAt: new Date() },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  // ── CRUD ────────────────────────────────────────────────────────

  /** List all admin accounts (passwords excluded). */
  async list() {
    try {
      return await prisma.admin.findMany({
        select: { id: true, username: true, email: true, lastLoginAt: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "asc" },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Create a new admin account. Password must already be hashed. */
  async create(data: { username: string; email: string; password: string }) {
    try {
      return await prisma.admin.create({
        data,
        select: { id: true, username: true, email: true, createdAt: true },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Update non-sensitive fields (username, email). */
  async update(id: string, data: { username?: string; email?: string }) {
    try {
      return await prisma.admin.update({
        where: { id },
        data,
        select: { id: true, username: true, email: true, updatedAt: true },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Replace the stored password hash. */
  async changePassword(id: string, hashedPassword: string) {
    try {
      return await prisma.admin.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Delete an admin account. */
  async delete(id: string) {
    try {
      return await prisma.admin.delete({ where: { id } });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  // ── Password reset ──────────────────────────────────────────────

  /** Store a reset token + expiry. Token must be pre-hashed or a secure random string. */
  async setResetToken(id: string, token: string, expiresAt: Date) {
    try {
      return await prisma.admin.update({
        where: { id },
        data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Look up an admin by reset token — returns null if not found or expired. */
  async findByResetToken(token: string) {
    try {
      return await prisma.admin.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiresAt: { gt: new Date() },
        },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },

  /** Clear the reset token after successful use. */
  async clearResetToken(id: string) {
    try {
      return await prisma.admin.update({
        where: { id },
        data: { passwordResetToken: null, passwordResetExpiresAt: null },
      });
    } catch (err) {
      throw handleDbError(err, "Admin");
    }
  },
};

