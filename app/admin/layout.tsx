/**
 * /admin layout — intentionally minimal passthrough.
 *
 * The login page lives at /admin/login and must NOT show the dashboard nav.
 * Dashboard-specific UI (nav bar) lives in /admin/(dashboard)/layout.tsx
 * which only applies to routes inside that route group.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

