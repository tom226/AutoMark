import fs from "fs";
import type { Channel, CompetitorFeedItem } from "@/lib/types";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

interface CompetitorFeedState {
  items: CompetitorFeedItem[];
  updatedAt: string;
}

const FEED_FILE = ".competitor-feed.json";
const FEED_KEY = "socialdukaan:competitor-feed";

const seedHandles: Array<{ handle: string; channel: Channel }> = [
  { handle: "@marketingpro", channel: "instagram" },
  { handle: "@growthdaily", channel: "facebook" },
  { handle: "@brandhacks", channel: "linkedin" },
  { handle: "@socialsprint", channel: "twitter" },
  { handle: "@sharechatindia", channel: "sharechat" },
  { handle: "@mojtrending", channel: "moj" },
  { handle: "@joshcreator", channel: "josh" },
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

async function readFileState(userId = "anon"): Promise<CompetitorFeedState | null> {
  const files = getPersistentFileCandidates(userScopedRelativePath(FEED_FILE, userId));
  try {
    return await readFirstExistingJson<CompetitorFeedState>(files);
  } catch {
    return null;
  }
}

async function writeFileState(state: CompetitorFeedState, userId = "anon"): Promise<void> {
  const files = getPersistentFileCandidates(userScopedRelativePath(FEED_FILE, userId));
  await writeJsonWithFallback(files, state);
}

export async function loadCompetitorFeedState(userId = "anon"): Promise<CompetitorFeedState> {
  const key = userScopedKey(FEED_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<CompetitorFeedState>(key);
    if (fromRedis?.items?.length) return fromRedis;
    const seeded = generateSeedFeed();
    await redisSetJson(key, seeded);
    return seeded;
  }

  const fromFile = await readFileState(userId);
  if (fromFile?.items?.length) return fromFile;

  const seeded = generateSeedFeed();
  await writeFileState(seeded, userId);
  return seeded;
}

export async function saveCompetitorFeedState(state: CompetitorFeedState, userId = "anon"): Promise<void> {
  const key = userScopedKey(FEED_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };
  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }
  await writeFileState(next, userId);
}

export async function listCompetitorFeedItems(userId = "anon"): Promise<CompetitorFeedItem[]> {
  const state = await loadCompetitorFeedState(userId);
  return [...state.items].sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
}
