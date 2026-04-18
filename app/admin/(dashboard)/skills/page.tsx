import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { SkillManager } from "@/components/admin/skill-manager";

export const metadata: Metadata = {
  title: "Skills",
};

export default async function AdminSkillsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-10 border-b border-[var(--color-border-light)] pb-6">
        <h1 className="font-display text-5xl">Skills</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Manage the predefined skills list that talent profiles can choose from.
        </p>
      </div>
      <SkillManager title="Skills" endpoint="/api/admin/skills" />
    </div>
  );
}
