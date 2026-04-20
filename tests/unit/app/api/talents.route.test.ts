import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const getPublicStats = vi.fn();
const createTalent = vi.fn();

vi.mock("@/repositories", () => ({
  statsRepository: {
    getPublicStats,
  },
  talentRepository: {
    create: createTalent,
  },
}));

describe("app/api/talents/route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns public stats from the repository", async () => {
    getPublicStats.mockResolvedValue({
      totalTalents: 12,
      totalSkills: 5,
      averageYears: 4,
      topSkill: "React",
    });

    const { GET } = await import("@/app/api/talents/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        totalTalents: 12,
        totalSkills: 5,
        averageYears: 4,
        topSkill: "React",
      },
    });
    expect(getPublicStats).toHaveBeenCalledOnce();
  });

  it("creates a talent on valid submission", async () => {
    createTalent.mockResolvedValue({
      id: "talent-1",
      fullName: "Jane Doe",
      email: "jane@example.com",
    });

    const { POST } = await import("@/app/api/talents/route");
    const request = new NextRequest("http://localhost:3000/api/talents", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Jane Doe",
        email: "jane@example.com",
        primarySkill: "Frontend",
        skills: ["React", "TypeScript"],
        yearsOfExperience: 4,
        description: "Experienced frontend engineer building accessible products.",
        location: "Lagos",
        portfolioUrl: "https://example.com",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(createTalent).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "talent-1",
        fullName: "Jane Doe",
        email: "jane@example.com",
      },
    });
  });

  it("returns validation errors for invalid submissions", async () => {
    const { POST } = await import("@/app/api/talents/route");
    const request = new NextRequest("http://localhost:3000/api/talents", {
      method: "POST",
      body: JSON.stringify({
        fullName: "",
        email: "bad-email",
        skills: [],
      }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(createTalent).not.toHaveBeenCalled();
  });
});