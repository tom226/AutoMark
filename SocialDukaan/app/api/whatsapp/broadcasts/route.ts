import { NextResponse } from "next/server";
import { listBroadcasts, markBroadcastSent, scheduleBroadcast } from "@/lib/whatsapp-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface BroadcastPayload {
  action?: "schedule" | "send_now";
  title?: string;
  message?: string;
  mediaUrl?: string;
  audience?: string[];
  scheduledAt?: string;
  broadcastId?: string;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const broadcasts = await listBroadcasts(userId);
  return NextResponse.json({ broadcasts });
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as BroadcastPayload;

    if (body.action === "send_now") {
      if (!body.broadcastId) {
        return NextResponse.json({ error: "broadcastId is required" }, { status: 400 });
      }

      const updated = await markBroadcastSent(body.broadcastId, userId);
      if (!updated) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      }

      return NextResponse.json({ broadcast: updated, message: "Broadcast marked as sent." });
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const scheduledAt = body.scheduledAt?.trim() || new Date().toISOString();
    const audience = Array.isArray(body.audience) && body.audience.length > 0 ? body.audience : ["all_customers"];

    const broadcast = await scheduleBroadcast({
      title: body.title || "WhatsApp Campaign",
      message: body.message,
      mediaUrl: body.mediaUrl,
      audience,
      scheduledAt,
    }, userId);

    return NextResponse.json({
      broadcast,
      message: "WhatsApp broadcast scheduled successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process WhatsApp broadcast" },
      { status: 500 }
    );
  }
}
