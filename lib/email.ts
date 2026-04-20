import { Resend } from "resend";

type EmailVariant = "invite" | "reset";

interface ActionEmailInput {
  toEmail: string;
  toName: string;
  actionLink: string;
  expiresIn: string;
}

const BRAND = {
  name: "Talent Hub",
  accent: "#e63000",
  ink: "#101010",
  muted: "#5b5b5b",
  border: "#d6d1cb",
  paper: "#f7f3ee",
  panel: "#fffdf9",
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function getFromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? "Talent Hub <onboarding@resend.dev>";
}

function getReplyToAddress() {
  return process.env.RESEND_REPLY_TO?.trim() || undefined;
}

function getEmailCopy(variant: EmailVariant, actionLink: string, expiresIn: string) {
  if (variant === "invite") {
    return {
      preheader: "You have been invited to join the Talent Hub admin team.",
      eyebrow: "Admin Invitation",
      title: "You have been invited to the team",
      body:
        "A super-admin created an administrator account for you. Use the secure link below to set your password and activate your access.",
      cta: "Set Password",
      note: `This invitation expires in ${expiresIn}. If it expires, a super-admin can send a fresh link from the Team page.`,
      text: [
        "You have been invited to join Talent Hub as an admin.",
        "Use the link below to set your password:",
        actionLink,
        `This invitation expires in ${expiresIn}.`,
      ].join("\n\n"),
    };
  }

  return {
    preheader: "Reset your Talent Hub admin password.",
    eyebrow: "Password Reset",
    title: "Reset your admin password",
    body:
      "We received a request to reset your Talent Hub admin password. Use the secure link below to choose a new one.",
    cta: "Reset Password",
    note: `This link expires in ${expiresIn}. If you did not request this, you can ignore this email.`,
    text: [
      "A password reset was requested for your Talent Hub admin account.",
      "Use the link below to reset your password:",
      actionLink,
      `This link expires in ${expiresIn}.`,
      "If you did not request this, you can ignore this email.",
    ].join("\n\n"),
  };
}

function renderActionEmail(
  variant: EmailVariant,
  toName: string,
  actionLink: string,
  expiresIn: string,
) {
  const copy = getEmailCopy(variant, actionLink, expiresIn);
  const salutation = toName.trim() || "there";

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${copy.title}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.paper};font-family:Inter,Segoe UI,Arial,sans-serif;color:${BRAND.ink};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;visibility:hidden;">${copy.preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BRAND.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:${BRAND.panel};border:1px solid ${BRAND.border};">
            <tr>
              <td style="padding:0;">
                <div style="height:10px;background:linear-gradient(90deg, ${BRAND.accent} 0%, #ff916f 100%);"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 40px 20px 40px;">
                <p style="margin:0 0 14px 0;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND.muted};font-weight:700;">${copy.eyebrow}</p>
                <h1 style="margin:0 0 18px 0;font-size:36px;line-height:1.05;font-weight:800;color:${BRAND.ink};">${copy.title}</h1>
                <p style="margin:0 0 12px 0;font-size:16px;line-height:1.7;color:${BRAND.ink};">Hi ${salutation},</p>
                <p style="margin:0;font-size:16px;line-height:1.7;color:${BRAND.ink};">${copy.body}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 40px 8px 40px;">
                <a href="${actionLink}" style="display:inline-block;background:${BRAND.ink};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.01em;padding:15px 22px;border:1px solid ${BRAND.ink};">${copy.cta}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 40px 0 40px;">
                <div style="border:1px solid ${BRAND.border};background:#fffaf5;padding:16px;">
                  <p style="margin:0 0 8px 0;font-size:13px;font-weight:700;color:${BRAND.ink};">Secure link</p>
                  <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};word-break:break-all;">${actionLink}</p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 40px 12px 40px;">
                <p style="margin:0;font-size:14px;line-height:1.7;color:${BRAND.muted};">${copy.note}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 36px 40px;border-top:1px solid ${BRAND.border};">
                <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${BRAND.muted};font-weight:700;">${BRAND.name}</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">Built for fast, secure talent operations. This message was sent from the admin access workflow.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: variant === "invite" ? "You are invited to Talent Hub admin" : "Reset your Talent Hub password",
    html,
    text: copy.text,
  };
}

async function sendActionEmail(
  variant: EmailVariant,
  { toEmail, toName, actionLink, expiresIn }: ActionEmailInput,
) {
  if (!resend) {
    console.error(`[email:${variant}] RESEND_API_KEY is not configured`);
    return;
  }

  const { subject, html, text } = renderActionEmail(
    variant,
    toName,
    actionLink,
    expiresIn,
  );

  const response = await resend.emails.send({
    from: getFromAddress(),
    to: [toEmail],
    replyTo: getReplyToAddress(),
    subject,
    html,
    text,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function sendPasswordResetEmail(input: ActionEmailInput) {
  await sendActionEmail("reset", input);
}

export async function sendAdminInviteEmail(input: ActionEmailInput) {
  await sendActionEmail("invite", input);
}