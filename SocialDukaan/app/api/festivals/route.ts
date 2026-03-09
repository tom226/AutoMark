import { NextResponse } from "next/server";
import { getOnboardingProfile } from "@/lib/onboarding-store";
import {
  getAllIndiaEvents,
  buildFestivalCaptionTemplate,
  listUpcomingIndiaEvents,
  listEventsByRegion,
  type IndiaLanguage,
  type IndiaFestivalEvent,
} from "@/lib/india-festivals";
import { getUserIdFromRequest } from "@/lib/user-session";

function parseLanguage(input: string | null): IndiaLanguage {
  const normalized = (input || "").trim().toLowerCase();
  const supported: IndiaLanguage[] = [
    "hindi", "hinglish", "marathi", "tamil", "bengali",
    "gujarati", "telugu", "kannada", "malayalam", "punjabi",
  ];
  if (supported.includes(normalized as IndiaLanguage)) {
    return normalized as IndiaLanguage;
  }
  return "english";
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "upcoming";
    const language = parseLanguage(url.searchParams.get("language"));
    const days = Math.min(Math.max(Number(url.searchParams.get("days") || "60"), 7), 365);
    const region = (url.searchParams.get("region") || "india") as IndiaFestivalEvent["region"];
    const tag = url.searchParams.get("tag");

    const profile = await getOnboardingProfile(userId);

    let source: IndiaFestivalEvent[];
    if (mode === "all") {
      source = region !== "india" ? listEventsByRegion(region) : getAllIndiaEvents();
    } else {
      source = listUpcomingIndiaEvents(new Date(), days);
      if (region !== "india") {
        source = source.filter((e) => e.region === region || e.region === "india");
      }
    }

    if (tag) {
      source = source.filter((e) => e.tags.includes(tag));
    }

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
      region,
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
