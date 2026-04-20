import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const randomBytes = vi.fn();
const createHash = vi.fn();
const getSuperAdminOrThrow = vi.fn();
const listAdmins = vi.fn();
const createAdmin = vi.fn();
const setResetToken = vi.fn();
const sendAdminInviteEmail = vi.fn();

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomBytes,
    createHash,
    default: actual,
  };
});

vi.mock("@/lib/auth", () => ({
  getSuperAdminOrThrow,
}));

vi.mock("@/repositories", () => ({
  adminRepository: {
    list: listAdmins,
    create: createAdmin,
    setResetToken,
  },
}));

vi.mock("@/lib/email", () => ({
  sendAdminInviteEmail,
}));

describe("app/api/admin/admins/route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    randomBytes.mockImplementation((size: number) => ({
      toString: () => (size === 64 ? "generated-random-password" : "invite-raw-token"),
    }));
    createHash.mockImplementation(() => {
      let value = "";
      return {
        update(input: string) {
          value = input;
          return this;
        },
        digest() {
          return `hashed:${value}`;
        },
      };
    });
  });

  it("lists admins for a super-admin request", async () => {
    getSuperAdminOrThrow.mockResolvedValue({ adminId: "super-1" });
    listAdmins.mockResolvedValue([{ id: "admin-1", username: "owner" }]);

    const { GET } = await import("@/app/api/admin/admins/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [{ id: "admin-1", username: "owner" }],
    });
    expect(listAdmins).toHaveBeenCalledOnce();
  });

  it("creates an invited admin and emails a raw setup link while storing a hashed token", async () => {
    getSuperAdminOrThrow.mockResolvedValue({ adminId: "super-1" });
    createAdmin.mockResolvedValue({
      id: "admin-2",
      username: "jane_admin",
      email: "jane@example.com",
    });
    setResetToken.mockResolvedValue(undefined);
    sendAdminInviteEmail.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/admin/admins/route");
    const request = new NextRequest("http://localhost:3000/api/admin/admins", {
      method: "POST",
      body: JSON.stringify({ username: "jane_admin", email: "jane@example.com" }),
      headers: { "Content-Type": "application/json", origin: "http://localhost:3000" },
    });

    const response = await POST(request);

    expect(createAdmin).toHaveBeenCalledWith({
      username: "jane_admin",
      email: "jane@example.com",
      password: expect.stringMatching(/^[a-f0-9]{128}$/),
    });
    expect(setResetToken).toHaveBeenCalledWith(
      "admin-2",
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.any(Date),
    );
    expect(sendAdminInviteEmail).toHaveBeenCalledWith({
      toEmail: "jane@example.com",
      toName: "jane_admin",
      actionLink: expect.stringMatching(
        /^http:\/\/localhost:3000\/admin\/reset-password\?token=[a-f0-9]{64}$/,
      ),
      expiresIn: "72 hours",
    });
    expect(response.status).toBe(201);
  });
});