import { NextResponse } from "next/server";
import { scoreContent, type ScoreChannel } from "@/lib/content-score";

interface ScorePayload {
  caption?: string;
  channel?: ScoreChannel;
  imageUrl?: string;
  scheduledAt?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScorePayload;

    if (!body.caption?.trim()) {
      return NextResponse.json({ error: "caption is required" }, { status: 400 });
    }

    if (!body.channel) {
      return NextResponse.json({ error: "channel is required" }, { status: 400 });
    }

    const result = await scoreContent({
      caption: body.caption,
      channel: body.channel,
      imageUrl: body.imageUrl,
      scheduledAt: body.scheduledAt,
    });

    return NextResponse.json({
      status: "ok",
      ...result,
      message:
        result.score >= 85
          ? "Excellent. This post is likely to perform strongly."
          : result.score >= 70
            ? "Good draft. Apply the top fixes to improve reach."
            : "Needs improvement. Follow the suggested actions before posting.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to score content" }, { status: 500 });
  }
}
