import { NextResponse } from "next/server";
import { refreshCompetitorMetrics } from "@/lib/competitor-store";
import { getUserIdFromRequest } from "@/lib/user-session";

/**
 * POST /api/competitors/refresh
 * Refresh metrics for a single competitor by scraping their profile.
 */
export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const body = await request.json();

  if (!body.competitorId) {
    return NextResponse.json({ error: "competitorId is required" }, { status: 400 });
  }

  const competitor = await refreshCompetitorMetrics(body.competitorId, userId);

  if (!competitor) {
    return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
  }

  return NextResponse.json({
    competitor,
    message: competitor.verificationStatus === "verified"
      ? `Metrics refreshed for ${competitor.handle} on ${competitor.channel}.`
      : `Could not reach profile for ${competitor.handle}.`,
  });
}
