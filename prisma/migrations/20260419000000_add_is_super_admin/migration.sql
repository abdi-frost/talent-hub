-- AlterTable: add isSuperAdmin column to admins (default false)
ALTER TABLE "admins" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
