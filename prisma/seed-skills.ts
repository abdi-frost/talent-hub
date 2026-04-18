/**
 * seed-skills.ts — Populates the Skill and PrimarySkill lookup tables.
 *
 * Safe to run multiple times: uses upsert so existing rows are unchanged.
 * Run via:  pnpm db:seed:skills
 *
 * After the initial seed, admins can add further entries through the
 * admin API (POST /api/admin/skills, POST /api/admin/primary-skills).
 */
import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { SKILLS_SEED, PRIMARY_SKILLS_SEED } from "../lib/constants";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
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
