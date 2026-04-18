import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-sm">
        <div className="border-2 border-[var(--color-border)] p-10">
          <h1 className="font-display text-4xl mb-1">{APP_NAME}</h1>
          <p className="text-sm text-[var(--color-muted)] mb-10 uppercase tracking-widest">
            Admin Access
          </p>
          {/* AdminLoginForm component goes here */}
          <p className="text-[var(--color-muted)] text-sm">Form loading…</p>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
          Restricted access. Authorised personnel only.
        </p>
      </div>
    </div>
  );
}
