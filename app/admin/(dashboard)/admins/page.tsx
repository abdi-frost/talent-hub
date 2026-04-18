import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminsManager } from "@/components/admin/admins-manager";

export const metadata: Metadata = {
  title: "Admin Accounts",
};

export default async function AdminAccountsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-10 border-b border-[var(--color-border-light)] pb-6">
        <h1 className="font-display text-5xl">Admin Accounts</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Manage administrator accounts — add, remove, or reset passwords.
        </p>
      </div>
      <AdminsManager />
    </div>
  );
}
