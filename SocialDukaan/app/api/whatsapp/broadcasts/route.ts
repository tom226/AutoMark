import { NextResponse } from "next/server";
import {
  listBroadcasts,
  executeBroadcast,
  scheduleBroadcast,
  getBroadcast,
  getWhatsAppConfig,
  type WhatsAppRecipient,
} from "@/lib/whatsapp-store";
import { getUserIdFromRequest } from "@/lib/user-session";

interface BroadcastPayload {
  action?: "schedule" | "send_now" | "status";
  title?: string;
  message?: string;
  mediaUrl?: string;
  audience?: string[];
  recipients?: { phone: string; name?: string }[];
  scheduledAt?: string;
  broadcastId?: string;
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  const url = new URL(request.url);
  const broadcastId = url.searchParams.get("id");

  // Single broadcast detail
  if (broadcastId) {
    const broadcast = await getBroadcast(broadcastId, userId);
    if (!broadcast) {
      return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
    }
    return NextResponse.json({ broadcast });
  }

  // List all
  const broadcasts = await listBroadcasts(userId);
  const config = getWhatsAppConfig();
  return NextResponse.json({
    broadcasts,
    whatsappConfigured: !!config,
  });
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromRequest(request);
    const body = (await request.json()) as BroadcastPayload;

    // Send broadcast immediately via WhatsApp Cloud API
    if (body.action === "send_now") {
      if (!body.broadcastId) {
        return NextResponse.json({ error: "broadcastId is required" }, { status: 400 });
      }

      const config = getWhatsAppConfig();
      if (!config) {
        return NextResponse.json({
          error: "WhatsApp Business not configured. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.",
          configRequired: true,
        }, { status: 422 });
      }

      const updated = await executeBroadcast(body.broadcastId, userId);
      if (!updated) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      }

      return NextResponse.json({
        broadcast: updated,
        message: `Broadcast ${updated.status}. Sent: ${updated.deliveryStats?.sent ?? 0}, Failed: ${updated.deliveryStats?.failed ?? 0}.`,
      });
    }

    // Get broadcast status
    if (body.action === "status") {
      if (!body.broadcastId) {
        return NextResponse.json({ error: "broadcastId is required" }, { status: 400 });
      }
      const broadcast = await getBroadcast(body.broadcastId, userId);
      if (!broadcast) {
        return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
      }
      return NextResponse.json({
        broadcast,
        deliveryStats: broadcast.deliveryStats,
      });
    }

    // Schedule a new broadcast
    if (!body.message?.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const scheduledAt = body.scheduledAt?.trim() || new Date().toISOString();
    const audience = Array.isArray(body.audience) && body.audience.length > 0 ? body.audience : ["all_customers"];

    // Map recipients to proper format
    const recipients: WhatsAppRecipient[] = (body.recipients || []).map((r) => ({
      phone: r.phone,
      name: r.name,
      status: "queued" as const,
    }));

    const broadcast = await scheduleBroadcast({
      title: body.title || "WhatsApp Campaign",
      message: body.message,
      mediaUrl: body.mediaUrl,
      audience,
      recipients,
      scheduledAt,
    }, userId);

    const config = getWhatsAppConfig();

    return NextResponse.json({
      broadcast,
      whatsappConfigured: !!config,
      message: config
        ? "WhatsApp broadcast scheduled. Use send_now action to dispatch via Cloud API."
        : "Broadcast saved. Configure WhatsApp Business API credentials to enable real sending.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process WhatsApp broadcast" },
      { status: 500 }
    );
  }
}
