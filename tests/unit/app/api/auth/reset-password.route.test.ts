import { createHash } from "crypto";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const hash = vi.fn();
const findByResetToken = vi.fn();
const changePassword = vi.fn();
const clearResetToken = vi.fn();

vi.mock("bcryptjs", () => ({
  default: {
    hash,
  },
}));

vi.mock("@/repositories", () => ({
  adminRepository: {
    findByResetToken,
    changePassword,
    clearResetToken,
  },
}));

describe("app/api/auth/reset-password/route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("hashes the incoming token before repository lookup", async () => {
    const rawToken = "plain-reset-token";
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");

    findByResetToken.mockResolvedValue({ id: "admin-1" });
    hash.mockResolvedValue("new-password-hash");
    changePassword.mockResolvedValue(undefined);
    clearResetToken.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token: rawToken, newPassword: "new-secret-123" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);

    expect(findByResetToken).toHaveBeenCalledWith(hashedToken);
    expect(hash).toHaveBeenCalledWith("new-secret-123", 12);
    expect(changePassword).toHaveBeenCalledWith("admin-1", "new-password-hash");
    expect(clearResetToken).toHaveBeenCalledWith("admin-1");
    expect(response.status).toBe(200);
  });

  it("rejects expired or invalid tokens", async () => {
    findByResetToken.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const request = new NextRequest(
      "http://localhost:3000/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token: "missing", newPassword: "new-secret-123" }),
        headers: { "Content-Type": "application/json" },
      },
    );

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("This reset link is invalid or has expired.");
    expect(changePassword).not.toHaveBeenCalled();
  });
});