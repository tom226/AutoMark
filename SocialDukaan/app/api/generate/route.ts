import { NextResponse } from "next/server";

interface GeneratePayload {
  topic?: string;
  tone?: string;
  channel?: "instagram" | "facebook" | "linkedin";
  inspirations?: string[];
}

const channelMap = {
  instagram: ["#InstaBusiness", "#BrandStory", "#DailyContent"],
  facebook: ["#CommunityFirst", "#BusinessUpdate", "#LocalGrowth"],
  linkedin: ["#ProfessionalBrand", "#Leadership", "#GrowthStrategy"]
} as const;

export async function POST(request: Request) {
  const body = (await request.json()) as GeneratePayload;

  if (!body.topic || !body.channel) {
    return NextResponse.json({ error: "topic and channel are required" }, { status: 400 });
  }

  const tone = body.tone ?? "Engaging";
  const inspirationLine =
    body.inspirations && body.inspirations.length > 0
      ? ` Inspired by: ${body.inspirations.slice(0, 2).join(" | ")}.`
      : "";

  const caption = `${tone} update: ${body.topic}.${inspirationLine} Crafted for your ${body.channel} audience with clear value and a strong call to action. 🚀`;

  return NextResponse.json({
    caption,
    hashtags: channelMap[body.channel],
    suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  });
}
