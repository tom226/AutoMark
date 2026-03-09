import { NextResponse } from "next/server";
import { getOnboardingProfile } from "@/lib/onboarding-store";
import {
  INDIA_EVENTS_2026,
  buildFestivalCaptionTemplate,
  listUpcomingIndiaEvents,
  type IndiaLanguage,
} from "@/lib/india-festivals";
import { getUserIdFromRequest } from "@/lib/user-session";

function parseLanguage(input: string | null): IndiaLanguage {
  const normalized = (input || "").trim().toLowerCase();
  if (
    normalized === "hindi" ||
    normalized === "hinglish" ||
    normalized === "marathi" ||
    normalized === "tamil" ||
    normalized === "bengali" ||
    normalized === "gujarati"
  ) {
    return normalized;
  }
  return "english";
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "upcoming";
    const language = parseLanguage(url.searchParams.get("language"));
    const days = Math.min(Math.max(Number(url.searchParams.get("days") || "60"), 7), 180);

    const profile = await getOnboardingProfile(userId);
    const source = mode === "all" ? INDIA_EVENTS_2026 : listUpcomingIndiaEvents(new Date(), days);

    const events = source.map((event) => ({
      ...event,
      templateCaption: buildFestivalCaptionTemplate({
        event,
        businessName: profile.businessName,
        niche: profile.niche,
        language,
      }),
    }));

    return NextResponse.json({
      events,
      language,
      total: events.length,
      message:
        events.length > 0
          ? `Loaded ${events.length} India-first festival/event suggestions.`
          : "No upcoming events in selected window.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load festivals" },
      { status: 500 }
    );
  }
}
