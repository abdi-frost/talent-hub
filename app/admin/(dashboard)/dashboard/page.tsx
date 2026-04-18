import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  await requireAdmin();

  return (
    <div>
      <div className="flex items-end justify-between mb-10 border-b border-[var(--color-border-light)] pb-6">
        <h1 className="font-display text-5xl">Talent Records</h1>
        {/* Action buttons (add talent, refresh) go here */}
      </div>
      {/* TalentTable component goes here */}
      <p className="text-[var(--color-muted)] text-sm">
        No talent records yet. Submit profiles via the public form.
      </p>
    </div>
  );
}
