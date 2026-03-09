import { NextResponse } from "next/server";
import {
  clearOnboardingProfile,
  getOnboardingProfile,
  saveOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/onboarding-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getOnboardingProfile();
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to load onboarding profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<OnboardingProfile>;
    const profile = await saveOnboardingProfile(body);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Failed to save onboarding profile" }, { status: 500 });
  }
}

// Backward-compatible write method for older clients that send POST.
export async function POST(request: Request) {
  return PUT(request);
}

export async function DELETE() {
  try {
    const profile = await clearOnboardingProfile();
    return NextResponse.json({ profile, reset: true });
  } catch {
    return NextResponse.json({ error: "Failed to reset onboarding profile" }, { status: 500 });
  }
}
