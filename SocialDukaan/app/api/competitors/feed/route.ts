import { NextResponse } from "next/server";
import { listCompetitors } from "@/lib/competitor-store";
import type { Channel } from "@/lib/types";
import { getUserIdFromRequest } from "@/lib/user-session";

const feedTemplates = [
  "Shared a practical tactic that improved post performance this week.",
  "Posted a short educational breakdown with clear CTA and value-first hook.",
  "Published a behind-the-scenes update that sparked strong engagement.",
  "Dropped a framework-style post that simplifies a common marketing challenge.",
  "Posted a timely trend reaction with actionable takeaways for followers.",
];

function channelHashtags(channel: Channel, index: number): string[] {
  if (channel === "sharechat") return ["#sharechat", "#hindicontent", index % 2 ? "#india" : "#creator"];
  if (channel === "moj") return ["#moj", "#shortvideo", index % 2 ? "#trending" : "#reels"];
  if (channel === "josh") return ["#joshapp", "#viralindia", index % 2 ? "#creator" : "#discover"];
  return ["#marketing", "#growth", "#socialmedia", "#content"].slice(0, 2 + (index % 2));
}

function channelPostUrl(handle: string, channel: Channel, index: number): string {
  const id = handle.replace("@", "");
  if (channel === "sharechat") return `https://sharechat.com/profile/${id}/post/${index + 1}`;
  if (channel === "moj") return `https://mojapp.in/@${id}/video/${index + 1}`;
  if (channel === "josh") return `https://share.myjosh.in/profile/${id}/video/${index + 1}`;
  return `https://example.com/${id}/post/${index + 1}`;
}

function parseNumber(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const cursor = parseNumber(url.searchParams.get("cursor"), 0);
  const limit = Math.min(parseNumber(url.searchParams.get("limit"), 12), 30);
  const channel = url.searchParams.get("channel") as Channel | null;

  const competitors = await listCompetitors(userId);
  const sourceCompetitors = competitors.some((item) => !item.isSeed)
    ? competitors.filter((item) => !item.isSeed)
    : competitors;

  const now = Date.now();
  const items = sourceCompetitors.flatMap((competitor, competitorIndex) =>
    Array.from({ length: 16 }, (_, postIndex) => {
      const template = feedTemplates[(competitorIndex + postIndex) % feedTemplates.length];
      const postedAt = new Date(now - (competitorIndex * 16 + postIndex) * 1000 * 60 * 70).toISOString();
      const hashtags = channelHashtags(competitor.channel, postIndex);

      return {
        id: `feed-${competitor.id}-${postIndex + 1}`,
        handle: competitor.handle,
        channel: competitor.channel,
        caption: `${template} (${competitor.handle})`,
        hashtags,
        postedAt,
        postUrl: channelPostUrl(competitor.handle, competitor.channel, postIndex),
      };
    })
  );

  const sorted = [...items].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
  const filtered = channel ? sorted.filter((item) => item.channel === channel) : sorted;

  const nextItems = filtered.slice(cursor, cursor + limit);
  const nextCursor = cursor + nextItems.length;

  return NextResponse.json({
    items: nextItems,
    cursor: nextCursor,
    hasMore: nextCursor < filtered.length,
    total: filtered.length,
    updatedAt: new Date().toISOString(),
  });
}
