import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ONBOARDING_COMPLETE_COOKIE,
  USER_SESSION_COOKIE,
  createSessionUserId,
  sanitizeUserId,
} from "@/lib/user-session";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.searchParams;
  const existing = request.cookies.get(USER_SESSION_COOKIE)?.value;
  const sessionId = sanitizeUserId(existing);

  if (pathname.startsWith("/dashboard")) {
    const onboardingDone = request.cookies.get(ONBOARDING_COMPLETE_COOKIE)?.value === "1";
    const onboardingRoute = pathname === "/dashboard/onboarding" || pathname.startsWith("/dashboard/onboarding/");
    const onboardingFlowParams =
      search.has("error") ||
      search.has("connected") ||
      search.has("manage") ||
      search.has("switch");

    if (!onboardingDone && !onboardingRoute) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard/onboarding";
      const response = NextResponse.redirect(redirectUrl);

      if (!(existing && sessionId !== "anon")) {
        response.cookies.set(USER_SESSION_COOKIE, createSessionUserId(), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }

      return response;
    }

    if (onboardingDone && onboardingRoute && !onboardingFlowParams) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      const response = NextResponse.redirect(redirectUrl);

      if (!(existing && sessionId !== "anon")) {
        response.cookies.set(USER_SESSION_COOKIE, createSessionUserId(), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }

      return response;
    }
  }

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
