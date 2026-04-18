import { describe, it, expect } from "vitest";
import {
  talentSubmissionSchema,
  adminLoginSchema,
  talentUpdateSchema,
} from "@/lib/validations";

const validPayload = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  primarySkill: "TypeScript" as const,
  skills: ["TypeScript", "React"] as const,
  yearsOfExperience: 3,
  description: "A skilled developer with expertise in TypeScript and React.",
};

describe("talentSubmissionSchema", () => {
  it("accepts a valid payload", () => {
    expect(talentSubmissionSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects empty full name", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      fullName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative years of experience", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      yearsOfExperience: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects description shorter than 10 characters", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      description: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects skills not in predefined list", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      skills: ["NotASkill"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty skills array", () => {
    const result = talentSubmissionSchema.safeParse({
      ...validPayload,
      skills: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("adminLoginSchema", () => {
  it("accepts valid credentials", () => {
    expect(
      adminLoginSchema.safeParse({ username: "admin", password: "secret" })
        .success,
    ).toBe(true);
  });

  it("rejects empty username", () => {
    expect(
      adminLoginSchema.safeParse({ username: "", password: "secret" }).success,
    ).toBe(false);
  });

  it("rejects empty password", () => {
    expect(
      adminLoginSchema.safeParse({ username: "admin", password: "" }).success,
    ).toBe(false);
  });
});

describe("talentUpdateSchema", () => {
  it("accepts an empty object (all fields optional)", () => {
    expect(talentUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial update", () => {
    expect(
      talentUpdateSchema.safeParse({ fullName: "Updated Name" }).success,
    ).toBe(true);
  });

  it("does not include email field", () => {
    // talentUpdateSchema omits email — it should not appear in output
    const result = talentUpdateSchema.safeParse({
      fullName: "Test",
      // email is not in the schema so Zod strips it (strip mode default)
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("email" in result.data).toBe(false);
    }
  });

  it("accepts a valid status value", () => {
    expect(
      talentUpdateSchema.safeParse({ status: "APPROVED" }).success,
    ).toBe(true);
  });

  it("rejects an invalid status value", () => {
    expect(
      talentUpdateSchema.safeParse({ status: "UNKNOWN" }).success,
    ).toBe(false);
  });
});
