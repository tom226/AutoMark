import { NextResponse } from "next/server";
import { getWhatsAppConfig, processWebhookStatus } from "@/lib/whatsapp-store";

/**
 * WhatsApp webhook verification (GET).
 * Meta sends hub.mode=subscribe, hub.verify_token, hub.challenge.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  const config = getWhatsAppConfig();
  const expectedToken = config?.webhookVerifyToken || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "socialdukaan_verify";

  if (mode === "subscribe" && token === expectedToken) {
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

/**
 * WhatsApp webhook for incoming messages and delivery status updates (POST).
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const entries = body.entry;
    if (!Array.isArray(entries)) {
      return NextResponse.json({ received: true });
    }

    for (const entry of entries) {
      const changes = entry.changes;
      if (!Array.isArray(changes)) continue;

      for (const change of changes) {
        if (change.field !== "messages") continue;
        const value = change.value;
        if (!value) continue;

        // Process message status updates (sent, delivered, read, failed)
        const statuses = value.statuses;
        if (Array.isArray(statuses)) {
          for (const statusUpdate of statuses) {
            const waMessageId = statusUpdate.id;
            const status = statusUpdate.status; // sent | delivered | read | failed

            if (waMessageId && ["sent", "delivered", "read", "failed"].includes(status)) {
              await processWebhookStatus(waMessageId, status);
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
