import { z } from "zod";
import { TalentStatus } from "./constants";

// ── Talent submission (public form) ───────────────────────────────

export const talentSubmissionSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name is too long"),
  email: z.email("Invalid email address"),
  /** Name of a PrimarySkill from the DB — validated against the live list in the UI */
  primarySkill: z.string().min(1, "Primary skill is required").max(100),
  /** Array of skill names from the DB */
  skills: z
    .array(z.string().min(1).max(100))
    .min(1, "Select at least one skill"),
  yearsOfExperience: z
    .number()
    .int("Must be a whole number")
    .min(0, "Experience cannot be negative")
    .max(60, "Please enter a realistic value"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description is too long"),
  location: z.string().max(100).optional(),
  portfolioUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type TalentSubmissionInput = z.infer<typeof talentSubmissionSchema>;

// ── Admin login ───────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// ── Talent update (admin only) ────────────────────────────────────

export const talentUpdateSchema = talentSubmissionSchema
  .omit({ email: true })
  .partial()
  .extend({
    status: z.nativeEnum(TalentStatus).optional(),
  });

export type TalentUpdateInput = z.infer<typeof talentUpdateSchema>;

// ── Admin talent list — query params ─────────────────────────────

export const talentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.nativeEnum(TalentStatus).optional(),
  primarySkill: z.string().max(100).optional(),
  search: z.string().max(100).optional(),
  /** Comma-separated skill names */
  skills: z.string().max(500).optional(),
  skillsMatch: z.enum(["all", "any"]).optional().default("any"),
  sortBy: z
    .enum(["createdAt", "yearsOfExperience", "fullName", "status"])
    .optional()
    .default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type TalentListQuery = z.infer<typeof talentListQuerySchema>;

// ── Skill / PrimarySkill management (admin) ───────────────────────

export const skillNameSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

export type SkillNameInput = z.infer<typeof skillNameSchema>;

// ── Admin account management ──────────────────────────────────────

export const createAdminSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, _ and -"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;



