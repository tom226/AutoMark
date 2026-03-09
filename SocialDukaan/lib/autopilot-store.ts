import fs from "fs";
import {
  isRedisRestConfigured,
  redisGetJson,
  redisSetJson,
} from "./redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "./persistent-file";
import { userScopedKey, userScopedRelativePath } from "./user-session";

export type AutopilotChannel = "instagram" | "facebook";

export interface AutopilotRuleConfig {
  id: string;
  channel: string;
  enabled: boolean;
  postsPerDay: number;
  bestTimeSlots: string[];
  competitorId?: string;
  tone: string;
}

export interface ScheduledJob {
  id: string;
  ruleId: string;
  channel: AutopilotChannel;
  pageId: string;
  runAtIso: string;
  status: "pending" | "posted" | "failed";
  attempts?: number;
  nextAttemptAtIso?: string;
  lastAttemptAtIso?: string;
  resultId?: string;
  error?: string;
}

export interface AutopilotState {
  selectedPageId: string;
  imageUrl?: string;
  campaignTopic?: string;
  rules: AutopilotRuleConfig[];
  jobs: ScheduledJob[];
  lastGeneratedDate?: string;
  lastResearchRefreshAt?: string;
  lastAutoGenerateAt?: string;
  updatedAt: string;
}

const AUTOPILOT_FILE = ".autopilot.json";
const AUTOPILOT_KEY = "socialdukaan:autopilot";

export async function loadAutopilotState(userId = "anon"): Promise<AutopilotState | null> {
  const key = userScopedKey(AUTOPILOT_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(AUTOPILOT_FILE, userId));
  if (isRedisRestConfigured()) {
    return redisGetJson<AutopilotState>(key);
  }

  try {
    return await readFirstExistingJson<AutopilotState>(files);
  } catch {
    return null;
  }
}

export async function saveAutopilotState(state: AutopilotState, userId = "anon"): Promise<void> {
  const key = userScopedKey(AUTOPILOT_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(AUTOPILOT_FILE, userId));
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeJsonWithFallback(files, next);
}

export async function ensureAutopilotState(partial?: Partial<AutopilotState>, userId = "anon"): Promise<AutopilotState> {
  const existing = await loadAutopilotState(userId);
  if (existing) return existing;

  const fresh: AutopilotState = {
    selectedPageId: partial?.selectedPageId ?? "",
    imageUrl: partial?.imageUrl,
    campaignTopic: partial?.campaignTopic,
    rules: partial?.rules ?? [],
    jobs: partial?.jobs ?? [],
    lastGeneratedDate: partial?.lastGeneratedDate,
    lastResearchRefreshAt: partial?.lastResearchRefreshAt,
    lastAutoGenerateAt: partial?.lastAutoGenerateAt,
    updatedAt: new Date().toISOString(),
  };
  await saveAutopilotState(fresh, userId);
  return fresh;
}

function parseSlotForToday(slot: string, now: Date): Date | null {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hourRaw = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hourRaw < 1 || hourRaw > 12 || minute < 0 || minute > 59) return null;

  let hour = hourRaw % 12;
  if (meridiem === "PM") hour += 12;

  const runAt = new Date(now);
  runAt.setHours(hour, minute, 0, 0);
  return runAt;
}

export function generateTodayJobsIfNeeded(state: AutopilotState, now = new Date()): AutopilotState {
  const todayKey = now.toISOString().slice(0, 10);
  if (state.lastGeneratedDate === todayKey) return state;

  const supportedRules = state.rules.filter(
    (rule) => rule.enabled && (rule.channel === "instagram" || rule.channel === "facebook")
  );

  const newJobs: ScheduledJob[] = [];
  for (const rule of supportedRules) {
    const slots = rule.bestTimeSlots.slice(0, Math.max(1, rule.postsPerDay));
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const runAt = parseSlotForToday(slots[slotIndex], now);
      if (!runAt) continue;

      const id = `${todayKey}-${rule.id}-${slotIndex}`;
      const alreadyExists = state.jobs.some((job) => job.id === id);
      if (alreadyExists) continue;

      newJobs.push({
        id,
        ruleId: rule.id,
        channel: rule.channel as AutopilotChannel,
        pageId: state.selectedPageId,
        runAtIso: runAt.toISOString(),
        status: "pending",
        attempts: 0,
      });
    }
  }

  return {
    ...state,
    jobs: [...state.jobs, ...newJobs],
    lastGeneratedDate: todayKey,
  };
}

export function getNextRetryIso(attemptNumber: number, now = new Date()): string {
  const boundedAttempt = Math.max(1, Math.min(attemptNumber, 6));
  const delayMinutes = 5 * 2 ** (boundedAttempt - 1);
  return new Date(now.getTime() + delayMinutes * 60_000).toISOString();
}
