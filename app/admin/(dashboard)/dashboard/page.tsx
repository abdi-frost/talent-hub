import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { TalentTable } from "@/components/admin/talent-table";

export const metadata: Metadata = {
  title: "Talent Records",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div>
      <div className="flex items-end justify-between mb-10 border-b border-[var(--color-border-light)] pb-6">
        <div>
          <h1 className="font-display text-5xl">Talent Records</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Manage all talent submissions — review, update or remove records.
          </p>
        </div>
      </div>
      <TalentTable />
    </div>
  );
}
