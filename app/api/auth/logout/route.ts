import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/handle-route";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getSession();
  await session.destroy();
  return NextResponse.redirect(new URL("/admin/login", request.nextUrl.origin));
});

