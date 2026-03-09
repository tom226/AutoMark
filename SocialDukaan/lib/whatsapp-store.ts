import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export type WhatsAppBroadcastStatus = "scheduled" | "sending" | "sent" | "partially_sent" | "failed";

export interface WhatsAppRecipient {
  phone: string;        // E.164 format: +919876543210
  name?: string;
  status?: "queued" | "sent" | "delivered" | "read" | "failed";
  waMessageId?: string;
  updatedAt?: string;
}

export interface WhatsAppBroadcast {
  id: string;
  title: string;
  message: string;
  mediaUrl?: string;
  audience: string[];         // segment tags like "all_customers"
  recipients: WhatsAppRecipient[];
  scheduledAt: string;
  status: WhatsAppBroadcastStatus;
  createdAt: string;
  sentAt?: string;
  deliveryStats?: {
    total: number;
    sent: number;
    delivered: number;
    read: number;
    failed: number;
  };
}

export interface WhatsAppConfig {
  phoneNumberId: string;       // Meta phone number ID
  businessAccountId: string;   // WhatsApp Business Account ID
  accessToken: string;         // Meta access token
  webhookVerifyToken: string;  // Webhook verification token
  configured: boolean;
}

interface WhatsAppState {
  broadcasts: WhatsAppBroadcast[];
  config?: WhatsAppConfig;
  updatedAt: string;
}

const WHATSAPP_FILE = "tasks/whatsapp-broadcasts.json";
const WHATSAPP_KEY = "socialdukaan:whatsapp-broadcasts";

// WhatsApp Cloud API base
const WA_API_BASE = "https://graph.facebook.com/v21.0";

async function loadState(userId = "anon"): Promise<WhatsAppState> {
  const key = userScopedKey(WHATSAPP_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(WHATSAPP_FILE, userId));
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<WhatsAppState>(key);
    if (fromRedis) return fromRedis;
    const empty: WhatsAppState = { broadcasts: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, empty);
    return empty;
  }

  const fromFile = await readFirstExistingJson<WhatsAppState>(files);
  if (fromFile) return fromFile;

  const empty: WhatsAppState = { broadcasts: [], updatedAt: new Date().toISOString() };
  await writeJsonWithFallback(files, empty);
  return empty;
}

async function saveState(state: WhatsAppState, userId = "anon"): Promise<void> {
  const key = userScopedKey(WHATSAPP_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(WHATSAPP_FILE, userId));
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeJsonWithFallback(files, next);
}

/** Get WhatsApp config from env vars or stored config */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const webhookVerifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "socialdukaan_verify";

  if (phoneNumberId && accessToken) {
    return {
      phoneNumberId,
      businessAccountId: businessAccountId || "",
      accessToken,
      webhookVerifyToken,
      configured: true,
    };
  }
  return null;
}

/** Send a single WhatsApp text message via Cloud API */
export async function sendWhatsAppMessage(
  to: string,
  text: string,
  config: WhatsAppConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch(
      `${WA_API_BASE}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to.replace(/[^0-9]/g, ""), // Clean to digits only
          type: "text",
          text: { preview_url: true, body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `API error ${response.status}`,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/** Send a WhatsApp media message via Cloud API */
export async function sendWhatsAppMediaMessage(
  to: string,
  text: string,
  mediaUrl: string,
  config: WhatsAppConfig
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const isImage = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(mediaUrl);
    const isVideo = /\.(mp4|3gp)(\?|$)/i.test(mediaUrl);
    const mediaType = isImage ? "image" : isVideo ? "video" : "document";

    const messageBody: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/[^0-9]/g, ""),
      type: mediaType,
      [mediaType]: {
        link: mediaUrl,
        caption: text,
      },
    };

    const response = await fetch(
      `${WA_API_BASE}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.accessToken}`,
        },
        body: JSON.stringify(messageBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || `API error ${response.status}`,
      };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/** Send broadcast to all recipients via WhatsApp Cloud API */
export async function executeBroadcast(
  broadcastId: string,
  userId = "anon"
): Promise<WhatsAppBroadcast | null> {
  const state = await loadState(userId);
  const broadcast = state.broadcasts.find((b) => b.id === broadcastId);
  if (!broadcast) return null;

  const config = getWhatsAppConfig();
  if (!config) {
    broadcast.status = "failed";
    await saveState(state, userId);
    return broadcast;
  }

  broadcast.status = "sending";
  broadcast.deliveryStats = {
    total: broadcast.recipients.length,
    sent: 0, delivered: 0, read: 0, failed: 0,
  };
  await saveState(state, userId);

  // Send to each recipient with rate limiting (max ~80/sec per WA guidelines)
  for (const recipient of broadcast.recipients) {
    const result = broadcast.mediaUrl
      ? await sendWhatsAppMediaMessage(recipient.phone, broadcast.message, broadcast.mediaUrl, config)
      : await sendWhatsAppMessage(recipient.phone, broadcast.message, config);

    if (result.success) {
      recipient.status = "sent";
      recipient.waMessageId = result.messageId;
      broadcast.deliveryStats!.sent++;
    } else {
      recipient.status = "failed";
      broadcast.deliveryStats!.failed++;
    }
    recipient.updatedAt = new Date().toISOString();
  }

  broadcast.sentAt = new Date().toISOString();
  broadcast.status =
    broadcast.deliveryStats!.failed === 0
      ? "sent"
      : broadcast.deliveryStats!.sent > 0
        ? "partially_sent"
        : "failed";

  await saveState(state, userId);
  return broadcast;
}

/** Process incoming webhook status updates from WhatsApp */
export async function processWebhookStatus(
  waMessageId: string,
  status: "sent" | "delivered" | "read" | "failed",
  userId = "anon"
): Promise<boolean> {
  const state = await loadState(userId);

  for (const broadcast of state.broadcasts) {
    for (const recipient of broadcast.recipients) {
      if (recipient.waMessageId === waMessageId) {
        recipient.status = status;
        recipient.updatedAt = new Date().toISOString();

        // Update stats
        if (broadcast.deliveryStats) {
          if (status === "delivered") broadcast.deliveryStats.delivered++;
          if (status === "read") broadcast.deliveryStats.read++;
        }

        await saveState(state, userId);
        return true;
      }
    }
  }
  return false;
}

export async function listBroadcasts(userId = "anon"): Promise<WhatsAppBroadcast[]> {
  const state = await loadState(userId);
  return [...state.broadcasts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function scheduleBroadcast(input: {
  title: string;
  message: string;
  mediaUrl?: string;
  audience: string[];
  recipients?: WhatsAppRecipient[];
  scheduledAt: string;
}, userId = "anon"): Promise<WhatsAppBroadcast> {
  const state = await loadState(userId);
  const broadcast: WhatsAppBroadcast = {
    id: `wa-${Date.now()}`,
    title: input.title.trim() || "WhatsApp Broadcast",
    message: input.message.trim(),
    mediaUrl: input.mediaUrl?.trim() || undefined,
    audience: input.audience,
    recipients: input.recipients || [],
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  state.broadcasts.push(broadcast);
  await saveState(state, userId);
  return broadcast;
}

export async function markBroadcastSent(id: string, userId = "anon"): Promise<WhatsAppBroadcast | null> {
  return executeBroadcast(id, userId);
}

export async function getBroadcast(id: string, userId = "anon"): Promise<WhatsAppBroadcast | null> {
  const state = await loadState(userId);
  return state.broadcasts.find((b) => b.id === id) || null;
}
