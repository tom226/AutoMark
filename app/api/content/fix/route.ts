import { NextResponse } from "next/server";
import { improveCaption } from "@/lib/content-fixer";
import type { ScoreChannel } from "@/lib/content-score";

interface FixPayload {
  caption?: string;
  channel?: ScoreChannel;
  imageUrl?: string;
  scheduledAt?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FixPayload;

    if (!body.caption?.trim()) {
      return NextResponse.json({ error: "caption is required" }, { status: 400 });
    }

    if (!body.channel) {
      return NextResponse.json({ error: "channel is required" }, { status: 400 });
    }

    const result = await improveCaption({
      caption: body.caption,
      channel: body.channel,
      imageUrl: body.imageUrl,
      scheduledAt: body.scheduledAt,
    });

    return NextResponse.json({
      status: "ok",
      ...result,
      message: "Applied top improvements. Review and post when ready.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to improve caption" }, { status: 500 });
  }
}
