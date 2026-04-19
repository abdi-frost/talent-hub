/**
 * POST /api/auth/reset-password
 *
 * Validates the reset token, then replaces the admin's password.
 */
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { withErrorHandling } from "@/lib/handle-route";
import { adminRepository } from "@/repositories";
import { AppError } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validations";
import { success, failure } from "@/lib/response";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json().catch(() => ({}));

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const { token, newPassword } = parsed.data;

  const admin = await adminRepository.findByResetToken(token);
  if (!admin) {
    throw AppError.badRequest("This reset link is invalid or has expired.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await adminRepository.changePassword(admin.id, hashedPassword);
  await adminRepository.clearResetToken(admin.id);

  return success("Password reset successfully.");
});
