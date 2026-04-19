/**
 * PUT    /api/admin/admins/[id] — update username/email (superAdmin only)
 * DELETE /api/admin/admins/[id] — remove an admin account (superAdmin only; cannot delete superAdmin)
 */
import { NextRequest } from "next/server";
import { getSuperAdminOrThrow } from "@/lib/auth";
import { adminRepository } from "@/repositories";
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
  await getSuperAdminOrThrow();
  const { id } = await ctx.params;

  const body = await request.json();

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
    const session = await getSuperAdminOrThrow();
    const { id } = await ctx.params;

    if (session.adminId === id) {
      throw AppError.badRequest("You cannot delete your own account");
    }

    await adminRepository.delete(id);
    return success("Admin account deleted");
  },
);
