import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export type WhatsAppBroadcastStatus = "scheduled" | "sent" | "failed";

export interface WhatsAppBroadcast {
  id: string;
  title: string;
  message: string;
  mediaUrl?: string;
  audience: string[];
  scheduledAt: string;
  status: WhatsAppBroadcastStatus;
  createdAt: string;
  sentAt?: string;
}

interface WhatsAppState {
  broadcasts: WhatsAppBroadcast[];
  updatedAt: string;
}

const WHATSAPP_FILE = "tasks/whatsapp-broadcasts.json";
const WHATSAPP_KEY = "socialdukaan:whatsapp-broadcasts";

async function loadState(userId = "anon"): Promise<WhatsAppState> {
  const key = userScopedKey(WHATSAPP_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(WHATSAPP_FILE, userId));
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<WhatsAppState>(key);
    if (fromRedis) return fromRedis;
    const empty = { broadcasts: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, empty);
    return empty;
  }

  const fromFile = await readFirstExistingJson<WhatsAppState>(files);
  if (fromFile) return fromFile;

  const empty = { broadcasts: [], updatedAt: new Date().toISOString() };
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

export async function listBroadcasts(userId = "anon"): Promise<WhatsAppBroadcast[]> {
  const state = await loadState(userId);
  return [...state.broadcasts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function scheduleBroadcast(input: {
  title: string;
  message: string;
  mediaUrl?: string;
  audience: string[];
  scheduledAt: string;
}, userId = "anon"): Promise<WhatsAppBroadcast> {
  const state = await loadState(userId);
  const broadcast: WhatsAppBroadcast = {
    id: `wa-${Date.now()}`,
    title: input.title.trim() || "WhatsApp Broadcast",
    message: input.message.trim(),
    mediaUrl: input.mediaUrl?.trim() || undefined,
    audience: input.audience,
    scheduledAt: input.scheduledAt,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };

  state.broadcasts.push(broadcast);
  await saveState(state, userId);
  return broadcast;
}

export async function markBroadcastSent(id: string, userId = "anon"): Promise<WhatsAppBroadcast | null> {
  const state = await loadState(userId);
  const target = state.broadcasts.find((item) => item.id === id);
  if (!target) return null;

  target.status = "sent";
  target.sentAt = new Date().toISOString();
  await saveState(state, userId);
  return target;
}
