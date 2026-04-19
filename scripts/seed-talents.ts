/**
 * scripts/seed-talents.ts
 *
 * Inserts 100 fake talent records using @faker-js/faker.
 * Safe to run multiple times — skips emails that already exist.
 *
 * Usage:
 *   pnpm seed:talents
 */
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { faker } from "@faker-js/faker";
import { PRIMARY_SKILLS_SEED, SKILLS_SEED, TalentStatus } from "../lib/constants";

// ── DB connection (mirrors seed.ts) ──────────────────────────────

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error("DATABASE_URL is not set. Aborting.");
  process.exit(1);
}

let connectionString = rawDbUrl;
try {
  const url = new URL(rawDbUrl);
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
    connectionString = url.toString();
  }
} catch {
  // fall back to raw string
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ── Helpers ───────────────────────────────────────────────────────

const PRIMARY_SKILLS = [...PRIMARY_SKILLS_SEED];
const SKILLS = [...SKILLS_SEED];
const STATUSES = Object.values(TalentStatus);

/** Pick `n` unique random items from an array */
function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(...copy.splice(idx, 1));
  }
  return result;
}

function weightedStatus(): string {
  // Realistic distribution: mostly PENDING, some REVIEWED/APPROVED, few REJECTED
  const roll = Math.random();
  if (roll < 0.40) return TalentStatus.PENDING;
  if (roll < 0.65) return TalentStatus.REVIEWED;
  if (roll < 0.85) return TalentStatus.APPROVED;
  return TalentStatus.REJECTED;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const COUNT = 100;
  console.log(`\n🌱  Seeding ${COUNT} fake talent records…\n`);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < COUNT; i++) {
    const primarySkill = faker.helpers.arrayElement(PRIMARY_SKILLS);
    // 2–5 random skills
    const skillCount = faker.number.int({ min: 2, max: 5 });
    const skills = sample(SKILLS, skillCount);
    const yearsOfExperience = faker.number.int({ min: 0, max: 15 });
    const email = faker.internet.email().toLowerCase();

    try {
      await prisma.talent.create({
        data: {
          fullName: faker.person.fullName(),
          email,
          primarySkill,
          skills,
          yearsOfExperience,
          description: faker.lorem.sentences({ min: 2, max: 4 }),
          location: faker.helpers.maybe(
            () => `${faker.location.city()}, ${faker.location.countryCode()}`,
            { probability: 0.7 },
          ),
          portfolioUrl: faker.helpers.maybe(
            () => faker.internet.url(),
            { probability: 0.5 },
          ),
          status: weightedStatus(),
          createdAt: faker.date.between({
            from: new Date("2024-01-01"),
            to: new Date(),
          }),
        },
      });
      inserted++;
      process.stdout.write(`\r  Inserted ${inserted}/${COUNT}`);
    } catch (err: unknown) {
      // P2002 = unique constraint (duplicate email) — skip silently
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code: string }).code === "P2002"
      ) {
        skipped++;
      } else {
        throw err;
      }
    }
  }

  console.log(`\n\n✅  Done — inserted: ${inserted}, skipped (duplicate email): ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
