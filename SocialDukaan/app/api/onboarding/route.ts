import { NextResponse } from "next/server";
import {
  clearOnboardingProfile,
  getOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/onboarding-store";
import { getUserIdFromRequest, ONBOARDING_COMPLETE_COOKIE } from "@/lib/user-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const profile = await getOnboardingProfile(userId);
    const response = NextResponse.json({ profile });
    if (profile.onboardingCompleted) {
      response.cookies.set(ONBOARDING_COMPLETE_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } else {
      response.cookies.delete(ONBOARDING_COMPLETE_COOKIE);
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to load onboarding profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as Partial<OnboardingProfile>;
    const profile = await saveOnboardingProfile(body, userId);
    const response = NextResponse.json({ profile });
    if (profile.onboardingCompleted) {
      response.cookies.set(ONBOARDING_COMPLETE_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    } else {
      response.cookies.delete(ONBOARDING_COMPLETE_COOKIE);
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to save onboarding profile" }, { status: 500 });
  }
}

// Backward-compatible write method for older clients that send POST.
export async function POST(request: Request) {
  return PUT(request);
}

export async function DELETE(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const profile = await clearOnboardingProfile(userId);
    const response = NextResponse.json({ profile, reset: true });
    response.cookies.delete(ONBOARDING_COMPLETE_COOKIE);
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to reset onboarding profile" }, { status: 500 });
  }
}
