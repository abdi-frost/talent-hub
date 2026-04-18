/**
 * seed-skills.ts — Populates the Skill and PrimarySkill lookup tables.
 *
 * Safe to run multiple times: uses upsert so existing rows are unchanged.
 * Run via:  pnpm db:seed:skills
 *
 * After the initial seed, admins can add further entries through the
 * admin API (POST /api/admin/skills, POST /api/admin/primary-skills).
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SKILLS_SEED, PRIMARY_SKILLS_SEED } from "../lib/constants";

// Ensure `DATABASE_URL` is loaded and avoid connecting to IPv6 localhost (::1)
const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error("DATABASE_URL environment variable is not set. Aborting seed.");
  process.exit(1);
}

let connectionString = rawDbUrl;
try {
  const url = new URL(rawDbUrl);
  if (url.hostname === "localhost") {
    // Some systems resolve `localhost` to ::1 which PostgreSQL may not be listening on.
    // Force IPv4 loopback to avoid P1001 connection errors.
    url.hostname = "127.0.0.1";
    connectionString = url.toString();
    console.log("Using 127.0.0.1 for localhost in DATABASE_URL to avoid IPv6 (::1) issues");
  }
} catch (e) {
  // ignore URL parse errors — fall back to raw connection string
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seeding skills lookup tables…");

  // ── Primary skills (career-path categories) ──────────────────────
  for (const name of PRIMARY_SKILLS_SEED) {
    await prisma.primarySkill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅  Primary skills seeded: ${PRIMARY_SKILLS_SEED.length} categories`);

  // ── Individual skills ────────────────────────────────────────────
  for (const name of SKILLS_SEED) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`✅  Skills seeded: ${SKILLS_SEED.length} entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
