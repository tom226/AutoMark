import fs from "fs";
import type { Channel, CompetitorFeedItem } from "@/lib/types";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";

interface CompetitorFeedState {
  items: CompetitorFeedItem[];
  updatedAt: string;
}

const FEED_FILES = getPersistentFileCandidates(".competitor-feed.json");
const FEED_KEY = "socialdukaan:competitor-feed";

const seedHandles: Array<{ handle: string; channel: Channel }> = [
  { handle: "@marketingpro", channel: "instagram" },
  { handle: "@growthdaily", channel: "facebook" },
  { handle: "@brandhacks", channel: "linkedin" },
  { handle: "@socialsprint", channel: "twitter" },
];

const seedCaptions = [
  "3 hooks that doubled engagement this week. Save this before your next post.",
  "Behind-the-scenes content outperformed polished creatives in our latest campaign.",
  "Quick framework: problem, proof, promise, CTA. Works across all channels.",
  "This simple content calendar cut our posting stress by 80%.",
  "Stop posting randomly. Build a repeatable content engine instead.",
];

function generateSeedFeed(): CompetitorFeedState {
  const now = Date.now();
  const items: CompetitorFeedItem[] = [];

  for (let i = 0; i < 48; i += 1) {
    const profile = seedHandles[i % seedHandles.length];
    const caption = seedCaptions[i % seedCaptions.length];
    const hashtags = ["#marketing", "#socialmedia", "#growth", "#content"].slice(0, 2 + (i % 3));

    items.push({
      id: `feed-${i + 1}`,
      handle: profile.handle,
      channel: profile.channel,
      caption,
      hashtags,
      postedAt: new Date(now - i * 1000 * 60 * 90).toISOString(),
      postUrl: `https://example.com/${profile.handle.replace("@", "")}/post/${i + 1}`,
    });
  }

  return {
    items,
    updatedAt: new Date().toISOString(),
  };
}

async function readFileState(): Promise<CompetitorFeedState | null> {
  try {
    return await readFirstExistingJson<CompetitorFeedState>(FEED_FILES);
  } catch {
    return null;
  }
}

async function writeFileState(state: CompetitorFeedState): Promise<void> {
  await writeJsonWithFallback(FEED_FILES, state);
}

export async function loadCompetitorFeedState(): Promise<CompetitorFeedState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<CompetitorFeedState>(FEED_KEY);
    if (fromRedis?.items?.length) return fromRedis;
    const seeded = generateSeedFeed();
    await redisSetJson(FEED_KEY, seeded);
    return seeded;
  }

  const fromFile = await readFileState();
  if (fromFile?.items?.length) return fromFile;

  const seeded = generateSeedFeed();
  await writeFileState(seeded);
  return seeded;
}

export async function saveCompetitorFeedState(state: CompetitorFeedState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };
  if (isRedisRestConfigured()) {
    await redisSetJson(FEED_KEY, next);
    return;
  }
  await writeFileState(next);
}

export async function listCompetitorFeedItems(): Promise<CompetitorFeedItem[]> {
  const state = await loadCompetitorFeedState();
  return [...state.items].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
}
