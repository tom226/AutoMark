import fs from "fs";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import type { Channel, Competitor } from "@/lib/types";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export type VerificationStatus = "unchecked" | "checking" | "verified" | "not_found" | "unknown";

export interface StoredCompetitor extends Competitor {
  isSeed?: boolean;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  checkedAt?: string;
}

interface CompetitorState {
  competitors: StoredCompetitor[];
  updatedAt: string;
}

const COMPETITOR_FILE = ".competitors.json";
const COMPETITORS_KEY = "socialdukaan:competitors";

const seedCompetitors: StoredCompetitor[] = [
  {
    id: "c1",
    handle: "@marketingpro",
    channel: "instagram",
    postsPerWeek: 7,
    avgEngagement: 4.2,
    topHashtags: ["#growth", "#branding", "#reels"],
    lastActivity: "2 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
  {
    id: "c2",
    handle: "@bizhacks",
    channel: "linkedin",
    postsPerWeek: 5,
    avgEngagement: 3.8,
    topHashtags: ["#leadership", "#startup", "#b2b"],
    lastActivity: "5 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
  {
    id: "c3",
    handle: "@trendsettr",
    channel: "twitter",
    postsPerWeek: 12,
    avgEngagement: 2.5,
    topHashtags: ["#marketing", "#socialmedia", "#threads"],
    lastActivity: "1 day ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
  {
    id: "c4",
    handle: "@bharatcreator",
    channel: "sharechat",
    postsPerWeek: 10,
    avgEngagement: 5.1,
    topHashtags: ["#hindicontent", "#india", "#dailyupdate"],
    lastActivity: "3 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
  {
    id: "c5",
    handle: "@mojtrendsindia",
    channel: "moj",
    postsPerWeek: 14,
    avgEngagement: 6.4,
    topHashtags: ["#shortvideo", "#mojindia", "#trending"],
    lastActivity: "1 hour ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
  {
    id: "c6",
    handle: "@joshviralhub",
    channel: "josh",
    postsPerWeek: 11,
    avgEngagement: 4.9,
    topHashtags: ["#joshapp", "#viralindia", "#creator"],
    lastActivity: "6 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
  },
];

async function readFileState(userId = "anon"): Promise<CompetitorState | null> {
  const files = getPersistentFileCandidates(userScopedRelativePath(COMPETITOR_FILE, userId));
  try {
    return await readFirstExistingJson<CompetitorState>(files);
  } catch {
    return null;
  }
}

async function writeFileState(state: CompetitorState, userId = "anon"): Promise<void> {
  const files = getPersistentFileCandidates(userScopedRelativePath(COMPETITOR_FILE, userId));
  await writeJsonWithFallback(files, state);
}

export async function loadCompetitorState(userId = "anon"): Promise<CompetitorState> {
  const key = userScopedKey(COMPETITORS_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<CompetitorState>(key);
    if (fromRedis?.competitors?.length) return fromRedis;
    const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
    await redisSetJson(key, seeded);
    return seeded;
  }

  const fromFile = await readFileState(userId);
  if (fromFile?.competitors?.length) return fromFile;

  const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
  await writeFileState(seeded, userId);
  return seeded;
}

export async function saveCompetitorState(state: CompetitorState, userId = "anon"): Promise<void> {
  const key = userScopedKey(COMPETITORS_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function listCompetitors(userId = "anon"): Promise<StoredCompetitor[]> {
  const state = await loadCompetitorState(userId);
  return state.competitors;
}

export async function addCompetitor(input: {
  handle: string;
  channel: Channel;
}, userId = "anon"): Promise<StoredCompetitor> {
  const state = await loadCompetitorState(userId);

  const competitor: StoredCompetitor = {
    id: `c${Date.now()}`,
    handle: input.handle.startsWith("@") ? input.handle : `@${input.handle}`,
    channel: input.channel,
    postsPerWeek: Math.floor(Math.random() * 8) + 2,
    avgEngagement: +(Math.random() * 4 + 1).toFixed(1),
    topHashtags:
      input.channel === "sharechat"
        ? ["#hindicontent", "#sharechat", "#india"]
        : input.channel === "moj"
          ? ["#moj", "#shortvideo", "#trending"]
          : input.channel === "josh"
            ? ["#joshapp", "#viral", "#creator"]
            : ["#marketing", "#growth", "#socialmedia"],
    lastActivity: "just now",
    isSeed: false,
    verificationStatus: "unchecked",
  };

  state.competitors.push(competitor);
  await saveCompetitorState(state, userId);
  return competitor;
}

export async function removeCompetitor(id: string, userId = "anon"): Promise<boolean> {
  const state = await loadCompetitorState(userId);
  const prevLen = state.competitors.length;
  state.competitors = state.competitors.filter((item) => item.id !== id);

  if (state.competitors.length === prevLen) return false;

  await saveCompetitorState(state, userId);
  return true;
}

export async function updateCompetitorVerification(input: {
  id: string;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
}, userId = "anon"): Promise<StoredCompetitor | null> {
  const state = await loadCompetitorState(userId);
  const target = state.competitors.find((item) => item.id === input.id);
  if (!target) return null;

  target.verificationStatus = input.verificationStatus;
  target.verificationMessage = input.verificationMessage;
  target.checkedAt = new Date().toISOString();

  await saveCompetitorState(state, userId);
  return target;
}
