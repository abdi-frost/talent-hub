/**
 * PUT    /api/admin/admins/[id] — update username/email or change password
 * DELETE /api/admin/admins/[id] — remove an admin account
 *
 * Changing password requires the current password for verification.
 * Providing { currentPassword, newPassword } triggers the password change path.
 * Providing { username } or { email } triggers the profile update path.
 */
import { NextRequest } from "next/server";
import { compareSync, hashSync } from "bcryptjs";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { adminRepository } from "@/repositories";
import { changePasswordSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, success, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const profileUpdateSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.email("Invalid email address").optional(),
});

export const PUT = withErrorHandling(async (request: NextRequest, ctx: Ctx) => {
  await getAuthenticatedAdminOrThrow();
  const { id } = await ctx.params;

  const body = await request.json();

  // Detect whether this is a password change or profile update
  if ("currentPassword" in body || "newPassword" in body) {
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return failure(AppError.validationError(parsed.error.flatten()));
    }

    const admin = await adminRepository.findById(id);
    if (!compareSync(parsed.data.currentPassword, admin.password)) {
      throw AppError.unauthorized("Current password is incorrect");
    }

    await adminRepository.changePassword(id, hashSync(parsed.data.newPassword, 12));
    return success("Password changed successfully");
  }

  // Profile update (username / email)
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }
  if (!parsed.data.username && !parsed.data.email) {
    throw AppError.badRequest("Provide at least one field to update");
  }

  const updated = await adminRepository.update(id, parsed.data);
  return single(updated);
});

export const DELETE = withErrorHandling(
  async (_request: NextRequest, ctx: Ctx) => {
    const session = await getAuthenticatedAdminOrThrow();
    const { id } = await ctx.params;

    // Prevent self-deletion
    if (session.adminId === id) {
      throw AppError.badRequest("You cannot delete your own account");
    }

    await adminRepository.delete(id);
    return success("Admin account deleted");
  },
);
