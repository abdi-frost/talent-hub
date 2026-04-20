import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

// Ensure DATABASE_URL is present and avoid IPv6 localhost (::1) issues
const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error("DATABASE_URL environment variable is not set. Aborting seed.");
  process.exit(1);
}

let connectionString = rawDbUrl;
try {
  const url = new URL(rawDbUrl);
  if (url.hostname === "localhost") {
    url.hostname = "127.0.0.1";
    connectionString = url.toString();
    console.log("Using 127.0.0.1 for localhost in DATABASE_URL to avoid IPv6 (::1) issues");
  }
} catch (e) {
  // fall back to raw connection string if parsing fails
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱  Seeding database…");

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const email = process.env.ADMIN_EMAIL ?? "admin@talent-hub.local";
  const password = process.env.ADMIN_PASSWORD ?? "P@ssw0rd";
  const isSuperAdmin = process.env.ADMIN_IS_SUPER_ADMIN !== "false";

  const admin = await prisma.admin.upsert({
    where: { username },
    update: {
      email,
      isSuperAdmin,
    },
    create: {
      username,
      email,
      password: hashSync(password, 12),
      isSuperAdmin,
    },
  });

  console.log(`✅  Admin seeded: ${admin.username} <${admin.email}>`);
  console.log(`🔐  Super-admin: ${admin.isSuperAdmin ? "enabled" : "disabled"}`);
  console.log("⚠️   Change the default credentials before deploying!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

