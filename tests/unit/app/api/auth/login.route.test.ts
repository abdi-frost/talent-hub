import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const compareSync = vi.fn();
const findByUsername = vi.fn();
const updateLastLogin = vi.fn();
const getSession = vi.fn();

vi.mock("bcryptjs", () => ({
  compareSync,
}));

vi.mock("@/repositories", () => ({
  adminRepository: {
    findByUsername,
    updateLastLogin,
  },
}));

vi.mock("@/lib/auth", () => ({
  getSession,
}));

describe("app/api/auth/login/route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    updateLastLogin.mockResolvedValue(undefined);
  });

  it("logs in a valid admin and persists super-admin state in session", async () => {
    const session = {
      save: vi.fn().mockResolvedValue(undefined),
    };
    getSession.mockResolvedValue(session);
    findByUsername.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      password: "stored-hash",
      isSuperAdmin: true,
    });
    compareSync.mockReturnValue(true);

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "secret" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(session).toMatchObject({
      isLoggedIn: true,
      adminId: "admin-1",
      isSuperAdmin: true,
    });
    expect(session.save).toHaveBeenCalledOnce();
    expect(updateLastLogin).toHaveBeenCalledWith("admin-1");
    await expect(response.json()).resolves.toEqual({
      success: true,
      message: "Logged in successfully",
    });
  });

  it("rejects invalid credentials", async () => {
    findByUsername.mockResolvedValue({
      id: "admin-1",
      username: "admin",
      password: "stored-hash",
      isSuperAdmin: false,
    });
    compareSync.mockReturnValue(false);

    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid username or password");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("returns validation errors for malformed payloads", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: "", password: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(findByUsername).not.toHaveBeenCalled();
  });
});