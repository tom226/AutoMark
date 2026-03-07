import { NextResponse } from "next/server";
import { getOnboardingProfile, saveOnboardingProfile, type OnboardingProfile } from "@/lib/onboarding-store";

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
