// ── TypeScript enums ──────────────────────────────────────────────
// DB stores the string value; status column is String in schema.

export enum TalentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

// ── Seed data ─────────────────────────────────────────────────────
// Used by prisma/seed-skills.ts — not imported at runtime.

export const PRIMARY_SKILLS_SEED = [
  "Frontend",
  "Backend",
  "Fullstack",
  "Mobile",
  "DevOps",
  "Data Science",
  "UI/UX Design",
  "Machine Learning",
  "Other",
] as const;

export const SKILLS_SEED = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Angular",
  "Node.js",
  "Express",
  "Python",
  "Django",
  "FastAPI",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST APIs",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Git",
  "CI/CD",
  "Tailwind CSS",
  "CSS",
  "HTML",
  "Figma",
  "UI/UX Design",
  "Machine Learning",
  "Data Analysis",
  "DevOps",
  "Testing",
  "Agile/Scrum",
] as const;

// ── App constants ─────────────────────────────────────────────────

export const SESSION_COOKIE_NAME = "talent-hub-admin-session";

export const APP_NAME = "Talent Hub";
export const APP_DESCRIPTION =
  "A platform for discovering and managing top talent.";
