import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth";
import { sessionOptions } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow unauthenticated access to the login page
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // iron-session reads from request.cookies (ReadonlyRequestCookies).
  // We only READ here (no session.save()), so the read-only cookies suffice.
  const session = await getIronSession<SessionData>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request.cookies as any,
    sessionOptions,
  );

  if (!session.isLoggedIn) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all /admin routes except /admin/login
  matcher: ["/admin/:path*"],
};

