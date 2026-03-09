import { NextResponse } from "next/server";
import { listCompetitors } from "@/lib/competitor-store";
import { fetchResearchUsingWrapper } from "@/lib/research-wrapper";
import { getResearchSnapshot, replaceResearchSnapshot } from "@/lib/research-store";
import { getResearchPreferences } from "@/lib/research-preferences-store";
import { getUserIdFromRequest } from "@/lib/user-session";

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const snapshot = await getResearchSnapshot(userId);
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  const competitors = await listCompetitors(userId);
  const userCompetitors = competitors.filter((item) => !item.isSeed);
  const preferences = await getResearchPreferences(userId);

  if (userCompetitors.length === 0) {
    return NextResponse.json(
      { error: "Add at least one competitor before running research." },
      { status: 400 }
    );
  }

  const fetched = await fetchResearchUsingWrapper({
    competitors: userCompetitors.map((item) => ({
      handle: item.handle,
      channel: item.channel,
    })),
    platforms: preferences.platforms,
    categories: preferences.categories,
    categoryWeights: preferences.categoryWeights,
    customHashtags: preferences.customHashtags,
  });

  if (fetched.items.length === 0) {
    const existing = await getResearchSnapshot(userId);
    if (existing.items.length > 0) {
      return NextResponse.json({
        ...existing,
        warning: "Live fetch returned no new data. Showing last stored research snapshot.",
      });
    }

    return NextResponse.json(
      {
        error: "Could not fetch competitor/trending data via wrapper right now. Try again shortly.",
        nextStep: "Check your internet and competitor handles, then click Refresh again.",
      },
      { status: 502 }
    );
  }

  const saved = await replaceResearchSnapshot({
    items: fetched.items,
    trendingHashtags: fetched.trendingHashtags,
  }, userId);

  return NextResponse.json({
    ...saved,
    fetchedCount: fetched.items.length,
    diagnostics: fetched.diagnostics,
    statusMessage: "Research refreshed successfully. Review the diagnostics below to see what was accepted or skipped.",
  });
}
