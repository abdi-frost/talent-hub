"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";

const BASE_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/admin/dashboard", label: "Talents" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/primary-skills", label: "Categories" },
] as const;

const SUPER_ADMIN_LINK = { href: "/admin/team", label: "Team" } as const;

interface AdminNavProps {
  isSuperAdmin?: boolean;
}

export function AdminNav({ isSuperAdmin = false }: AdminNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = isSuperAdmin ? [...BASE_NAV_LINKS, SUPER_ADMIN_LINK] : BASE_NAV_LINKS;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b-2 border-[var(--color-border)] bg-[var(--color-foreground)] text-[var(--color-background)] sticky top-0 z-40">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Logo variant="dark" width={120} href="/admin/dashboard" />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm px-4 py-2 border transition-colors ${
                isActive(href)
                  ? "border-[var(--color-background)]/40 bg-[var(--color-background)]/10"
                  : "border-transparent hover:border-[var(--color-background)]/30"
              }`}
            >
              {label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="POST" className="ml-3">
            <button
              type="submit"
              className="text-sm border border-[var(--color-background)] px-4 py-2 hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] transition-colors"
            >
              Sign Out
            </button>
          </form>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
        >
          <span
            className={`block w-6 h-0.5 bg-[var(--color-background)] transition-transform origin-center ${
              menuOpen ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[var(--color-background)] transition-opacity ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-0.5 bg-[var(--color-background)] transition-transform origin-center ${
              menuOpen ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--color-background)]/20 bg-[var(--color-foreground)]">
          <nav className="flex flex-col divide-y divide-[var(--color-background)]/10">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`px-6 py-4 text-sm transition-colors ${
                  isActive(href)
                    ? "bg-[var(--color-background)]/10 font-medium"
                    : "hover:bg-[var(--color-background)]/5"
                }`}
              >
                {label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full text-left px-6 py-4 text-sm text-[var(--color-accent)] hover:bg-[var(--color-background)]/5 transition-colors"
              >
                Sign Out →
              </button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}