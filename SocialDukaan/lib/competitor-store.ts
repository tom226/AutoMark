import fs from "fs";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import type { Channel, Competitor } from "@/lib/types";

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

const COMPETITOR_FILES = getPersistentFileCandidates(".competitors.json");
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
];

async function readFileState(): Promise<CompetitorState | null> {
  try {
    return await readFirstExistingJson<CompetitorState>(COMPETITOR_FILES);
  } catch {
    return null;
  }
}

async function writeFileState(state: CompetitorState): Promise<void> {
  await writeJsonWithFallback(COMPETITOR_FILES, state);
}

export async function loadCompetitorState(): Promise<CompetitorState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<CompetitorState>(COMPETITORS_KEY);
    if (fromRedis?.competitors?.length) return fromRedis;
    const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
    await redisSetJson(COMPETITORS_KEY, seeded);
    return seeded;
  }

  const fromFile = await readFileState();
  if (fromFile?.competitors?.length) return fromFile;

  const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
  await writeFileState(seeded);
  return seeded;
}

export async function saveCompetitorState(state: CompetitorState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(COMPETITORS_KEY, next);
    return;
  }

  await writeFileState(next);
}

export async function listCompetitors(): Promise<StoredCompetitor[]> {
  const state = await loadCompetitorState();
  return state.competitors;
}

export async function addCompetitor(input: {
  handle: string;
  channel: Channel;
}): Promise<StoredCompetitor> {
  const state = await loadCompetitorState();

  const competitor: StoredCompetitor = {
    id: `c${Date.now()}`,
    handle: input.handle.startsWith("@") ? input.handle : `@${input.handle}`,
    channel: input.channel,
    postsPerWeek: Math.floor(Math.random() * 8) + 2,
    avgEngagement: +(Math.random() * 4 + 1).toFixed(1),
    topHashtags: ["#marketing", "#growth", "#socialmedia"],
    lastActivity: "just now",
    isSeed: false,
    verificationStatus: "unchecked",
  };

  state.competitors.push(competitor);
  await saveCompetitorState(state);
  return competitor;
}

export async function removeCompetitor(id: string): Promise<boolean> {
  const state = await loadCompetitorState();
  const prevLen = state.competitors.length;
  state.competitors = state.competitors.filter((item) => item.id !== id);

  if (state.competitors.length === prevLen) return false;

  await saveCompetitorState(state);
  return true;
}

export async function updateCompetitorVerification(input: {
  id: string;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
}): Promise<StoredCompetitor | null> {
  const state = await loadCompetitorState();
  const target = state.competitors.find((item) => item.id === input.id);
  if (!target) return null;

  target.verificationStatus = input.verificationStatus;
  target.verificationMessage = input.verificationMessage;
  target.checkedAt = new Date().toISOString();

  await saveCompetitorState(state);
  return target;
}
