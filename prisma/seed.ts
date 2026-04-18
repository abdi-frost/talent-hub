import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seeding database…");

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const email = process.env.ADMIN_EMAIL ?? "admin@talent-hub.local";
  const password = process.env.ADMIN_PASSWORD ?? "P@ssw0rd";

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {},
    create: {
      username,
      email,
      password: hashSync(password, 12),
    },
  });

  console.log(`✅  Admin seeded: ${admin.username} <${admin.email}>`);
  console.log("⚠️   Change the default credentials before deploying!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

