import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  USER_SESSION_COOKIE,
  createSessionUserId,
  sanitizeUserId,
} from "@/lib/user-session";

export function middleware(request: NextRequest) {
  const existing = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const sessionId = sanitizeUserId(existing);

  if (existing && sessionId !== "anon") {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(USER_SESSION_COOKIE, createSessionUserId(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*|.*\\..*).*)"],
};
