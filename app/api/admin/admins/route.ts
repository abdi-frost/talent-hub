/**
 * GET  /api/admin/admins — list all admin accounts
 * POST /api/admin/admins — create a new admin account
 */
import { NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { getAuthenticatedAdminOrThrow } from "@/lib/auth";
import { adminRepository } from "@/repositories";
import { createAdminSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

export const GET = withErrorHandling(async () => {
  await getAuthenticatedAdminOrThrow();
  const admins = await adminRepository.list();
  return single(admins);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await getAuthenticatedAdminOrThrow();

  const body = await request.json();
  const parsed = createAdminSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const { username, email, password } = parsed.data;
  const admin = await adminRepository.create({
    username,
    email,
    password: hashSync(password, 12),
  });

  return single(admin, 201);
});
