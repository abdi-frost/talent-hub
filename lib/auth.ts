import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "./constants";
import { AppError } from "./errors";

export interface SessionData {
  adminId?: string;
  isLoggedIn?: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: SESSION_COOKIE_NAME,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

/**
 * Get the iron-session in a Server Component or Route Handler.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/**
 * For Server Components / Pages — redirects to login if not authenticated.
 */
export async function requireAdmin(): Promise<IronSession<SessionData>> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * For API Route Handlers — throws AppError.unauthorized() instead of redirecting.
 * Use this inside withErrorHandling() so the error is mapped to a 401 JSON response.
 */
export async function getAuthenticatedAdminOrThrow(): Promise<
  IronSession<SessionData>
> {
  const session = await getSession();
  if (!session.isLoggedIn) {
    throw AppError.unauthorized();
  }
  return session;
}

