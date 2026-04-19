import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
    title: {
        default: "Dashboard",
        template: `%s — Admin — ${APP_NAME}`,
    },
};

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <AdminNav />

            {/* ── Page Content ─────────────────────────────────────── */}
            <main className="flex-1 max-w-8xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
                {children}
            </main>
        </div>
    );
}
