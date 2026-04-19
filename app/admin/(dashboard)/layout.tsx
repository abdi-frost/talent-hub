import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

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
            {/* ── Top Nav ──────────────────────────────────────────── */}
            <header className="border-b-2 border-[var(--color-border)] bg-[var(--color-foreground)] text-[var(--color-background)] sticky top-0 z-40">
                <div className="max-w-8xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link
                        href="/admin/dashboard"
                        className="font-display text-xl tracking-widest hover:text-[var(--color-accent)] transition-colors"
                    >
                        {APP_NAME} — Admin
                    </Link>

                    <nav className="flex items-center gap-1">
                        <Link
                            href="/"
                            className="text-sm px-4 py-2 border border-transparent hover:border-[var(--color-background)]/30 transition-colors"
                        >
                            Home
                        </Link>
                        <Link
                            href="/admin/dashboard"
                            className="text-sm px-4 py-2 border border-transparent hover:border-[var(--color-background)]/30 transition-colors"
                        >
                            Talents
                        </Link>
                        <Link
                            href="/admin/skills"
                            className="text-sm px-4 py-2 border border-transparent hover:border-[var(--color-background)]/30 transition-colors"
                        >
                            Skills
                        </Link>
                        <Link
                            href="/admin/primary-skills"
                            className="text-sm px-4 py-2 border border-transparent hover:border-[var(--color-background)]/30 transition-colors"
                        >
                            Categories
                        </Link>
                        <Link
                            href="/admin/admins"
                            className="text-sm px-4 py-2 border border-transparent hover:border-[var(--color-background)]/30 transition-colors"
                        >
                            Admins
                        </Link>

                        {/* Sign Out via API route */}
                        <form action="/api/auth/logout" method="POST" className="ml-3">
                            <button
                                type="submit"
                                className="text-sm border border-[var(--color-background)] px-4 py-2 hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] transition-colors"
                            >
                                Sign Out
                            </button>
                        </form>
                    </nav>
                </div>
            </header>

            {/* ── Page Content ─────────────────────────────────────── */}
            <main className="flex-1 max-w-8xl w-full mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
