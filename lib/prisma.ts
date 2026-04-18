import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const rawDbUrl = process.env.DATABASE_URL;
  let connectionString = rawDbUrl;
  if (!rawDbUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  try {
    const url = new URL(rawDbUrl);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
      connectionString = url.toString();
    }
  } catch (e) {
    // ignore and use raw connection string
  }

  const adapter = new PrismaPg({
    connectionString: connectionString!,
  });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

