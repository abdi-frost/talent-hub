/**
 * GET  /api/admin/admins — list all admin accounts (superAdmin only)
 * POST /api/admin/admins — invite a new admin by email (no password; they set it via email link)
 */
import { NextRequest } from "next/server";
import { randomBytes, createHash } from "crypto";
import { getSuperAdminOrThrow } from "@/lib/auth";
import { adminRepository } from "@/repositories";
import { inviteAdminSchema } from "@/lib/validations";
import { withErrorHandling } from "@/lib/handle-route";
import { single, failure } from "@/lib/response";
import { AppError } from "@/lib/errors";

const TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours — generous for invites

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function sendInviteEmail(
  toEmail: string,
  toName: string,
  inviteLink: string,
): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  // Allow a dedicated invite template; fall back to the reset-password template
  const templateId =
    process.env.EMAILJS_INVITE_TEMPLATE_ID ?? process.env.EMAILJS_TEMPLATE_ID;

  if (!serviceId || !templateId || !publicKey) {
    console.error("[invite-admin] EmailJS env vars not configured");
    return;
  }

  const body: Record<string, unknown> = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      to_email: toEmail,
      to_name: toName,
      reset_link: inviteLink,
      expiry: "72 hours",
    },
  };

  if (privateKey) body.accessToken = privateKey;

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[invite-admin] EmailJS returned", res.status, text);
  }
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
  sendInviteEmail(email, username, inviteLink).catch((err) =>
    console.error("[invite-admin] Unexpected send error:", err),
  );

  // Log who sent the invite (for audit)
  console.info(
    `[invite-admin] Admin ${session.adminId} invited ${username} <${email}>`,
  );

  return single(admin, 201);
});
