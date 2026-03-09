import { NextResponse } from "next/server";
import {
  clearOnboardingProfile,
  getOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/onboarding-store";
import { getUserIdFromRequest } from "@/lib/user-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const profile = await getOnboardingProfile(userId);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to load onboarding profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as Partial<OnboardingProfile>;
    const profile = await saveOnboardingProfile(body, userId);
    return NextResponse.json({ profile });
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
    return NextResponse.json({ profile, reset: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset onboarding profile" }, { status: 500 });
  }
}
