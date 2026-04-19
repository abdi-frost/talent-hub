import type { Metadata } from "next";
import { requireSuperAdmin } from "@/lib/auth";
import { AdminsManager } from "@/components/admin/admins-manager";

export const metadata: Metadata = {
  title: "Team Management",
};

export default async function TeamPage() {
  await requireSuperAdmin();

  return (
    <div>
      <div className="mb-10 border-b border-[var(--color-border-light)] pb-6">
        <h1 className="font-display text-5xl">Team</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Invite and manage administrator accounts. Only super-admins can access
          this page.
        </p>
      </div>
      <AdminsManager />
    </div>
  );
}
