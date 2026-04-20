/**
 * GET  /api/admin/admins — list all admin accounts (superAdmin only)
 * POST /api/admin/admins — invite a new admin by email (no password; they set it via email link)
 */
import { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getSuperAdminOrThrow } from "@/lib/auth";
import { sendAdminInviteEmail } from "@/lib/email";
import { adminRepository } from "@/repositories";
import { inviteAdminSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

const TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours — generous for invites

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const GET = withErrorHandling(async () => {
  await getSuperAdminOrThrow();
  const admins = await adminRepository.list();
  return single(admins);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSuperAdminOrThrow();

  const body = await request.json();
  const parsed = inviteAdminSchema.safeParse(body);
  if (!parsed.success) {
    return failure(AppError.validationError(parsed.error.flatten()));
  }

  const { username, email } = parsed.data;

  // Create the account with a random unusable password — they must set it via invite link
  const randomPassword = randomBytes(64).toString("hex");
  const admin = await adminRepository.create({
    username,
    email,
    password: randomPassword, // not bcrypt-hashed on purpose — cannot log in until they set password
  });

  // Generate invite token (raw in link, hash stored in DB)
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  await adminRepository.setResetToken(admin.id, hashedToken, expiresAt);

  const baseUrl =
    process.env.APP_BASE_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000";

  const inviteLink = `${baseUrl}/admin/reset-password?token=${rawToken}`;

  // Fire-and-forget — email failure must not block the response
  sendAdminInviteEmail({
    toEmail: email,
    toName: username,
    actionLink: inviteLink,
    expiresIn: "72 hours",
  }).catch((err) =>
    console.error("[invite-admin] Unexpected send error:", err),
  );

  // Log who sent the invite (for audit)
  console.info(
    `[invite-admin] Admin ${session.adminId} invited ${username} <${email}>`,
  );

  return single(admin, 201);
});
