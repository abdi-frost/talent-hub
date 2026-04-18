import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { SkillManager } from "@/components/admin/skill-manager";

export const metadata: Metadata = {
  title: "Primary Skill Categories",
};

export default async function AdminPrimarySkillsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-10 border-b border-[var(--color-border-light)] pb-6">
        <h1 className="font-display text-5xl">Skill Categories</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Manage primary skill paths (e.g. Frontend, Backend, DevOps) used to
          categorise talent profiles.
        </p>
      </div>
      <SkillManager title="Categories" endpoint="/api/admin/primary-skills" />
    </div>
  );
}
