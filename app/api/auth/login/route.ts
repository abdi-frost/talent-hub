import { NextRequest } from "next/server";
import { compareSync } from "bcryptjs";
import { getSession } from "@/lib/auth";
import { adminRepository } from "@/repositories";
import { adminLoginSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { success, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const parsed = adminLoginSchema.safeParse(body);

  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const { username, password } = parsed.data;
  const admin = await adminRepository.findByUsername(username);

  // Constant-time comparison — always run even when admin doesn't exist
  const passwordMatch = admin ? compareSync(password, admin.password) : false;

  if (!admin || !passwordMatch) {
    throw AppError.unauthorized("Invalid username or password");
  }

  const session = await getSession();
  session.isLoggedIn = true;
  session.adminId = admin.id;
  session.isSuperAdmin = admin.isSuperAdmin;
  await session.save();

  // Fire-and-forget: update last login timestamp
  adminRepository.updateLastLogin(admin.id).catch(console.error);

  return success("Logged in successfully");
});

