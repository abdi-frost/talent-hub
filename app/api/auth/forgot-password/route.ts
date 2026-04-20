/**
 * POST /api/auth/forgot-password
 *
 * Accepts { email } and if an admin with that email exists:
 *  1. Generates a cryptographically-random reset token
 *  2. Stores a SHA-256 hash of the token + 1-hour expiry on the admin record
 *  3. Sends the reset link via Resend with a branded HTML email
 *
 * Always responds 200 to prevent user enumeration.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { adminRepository } from "@/repositories";
import { withErrorHandling } from "@/lib/handle-route";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const SAFE_OK = NextResponse.json(
  {
    success: true,
    message:
      "If an admin account with that email exists, a reset link has been sent.",
  },
  { status: 200 },
);

export const POST = withErrorHandling(async (request: NextRequest) => {
  let email: string;
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return SAFE_OK;
  }

  if (!email) return SAFE_OK;

  // Find admin by iterating list (avoids dedicated findByEmail exposing existence)
  const admins = await adminRepository.list().catch(() => []);
  const admin = admins.find((a) => a.email.toLowerCase() === email);
  if (!admin) return SAFE_OK;

  // Generate a secure token: raw goes into the link, hash is stored
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = sha256(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await adminRepository.setResetToken(admin.id, hashedToken, expiresAt);

  const baseUrl =
    process.env.APP_BASE_URL ??
    request.headers.get("origin") ??
    "http://localhost:3000";

  const resetLink = `${baseUrl}/admin/reset-password?token=${rawToken}`;

  // Fire-and-forget — email delivery failure must not reveal server internals
  sendPasswordResetEmail({
    toEmail: admin.email,
    toName: admin.username,
    actionLink: resetLink,
    expiresIn: "1 hour",
  }).catch((err) =>
    console.error("[forgot-password] Unexpected send error:", err),
  );

  return SAFE_OK;
});

