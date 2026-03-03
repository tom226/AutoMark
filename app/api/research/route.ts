import { NextResponse } from "next/server";
import { listCompetitors } from "@/lib/competitor-store";
import { fetchResearchUsingWrapper } from "@/lib/research-wrapper";
import { getResearchSnapshot, replaceResearchSnapshot } from "@/lib/research-store";
import { getResearchPreferences } from "@/lib/research-preferences-store";

export async function GET() {
  const snapshot = await getResearchSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST() {
  const competitors = await listCompetitors();
  const userCompetitors = competitors.filter((item) => !item.isSeed);
  const preferences = await getResearchPreferences();

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
    const existing = await getResearchSnapshot();
    if (existing.items.length > 0) {
      return NextResponse.json({
        ...existing,
        warning: "Live fetch returned no new data. Showing last stored research snapshot.",
      });
    }

    return NextResponse.json(
      {
        error: "Could not fetch competitor/trending data via wrapper right now. Try again shortly.",
      },
      { status: 502 }
    );
  }

  const saved = await replaceResearchSnapshot({
    items: fetched.items,
    trendingHashtags: fetched.trendingHashtags,
  });

  return NextResponse.json({
    ...saved,
    fetchedCount: fetched.items.length,
  });
}
