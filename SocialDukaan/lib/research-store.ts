import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export interface ResearchItem {
  id: string;
  competitorHandle: string;
  channel: "instagram" | "facebook" | "linkedin" | "twitter";
  sourceUrl: string;
  title: string;
  snippet: string;
  hashtags: string[];
  fetchedAt: string;
}

export interface TrendingHashtag {
  tag: string;
  count: number;
  sources: string[];
}

interface ResearchState {
  items: ResearchItem[];
  trendingHashtags: TrendingHashtag[];
  updatedAt: string;
}

const RESEARCH_FILE = "tasks/research-cache.json";
const RESEARCH_KEY = "socialdukaan:research-cache";

function getResearchFilePath(userId = "anon"): string {
  return path.join(process.cwd(), userScopedRelativePath(RESEARCH_FILE, userId));
}

async function readFileState(userId = "anon"): Promise<ResearchState | null> {
  const filePath = getResearchFilePath(userId);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(raw) as ResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: ResearchState, userId = "anon"): Promise<void> {
  const filePath = getResearchFilePath(userId);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

export async function loadResearchState(userId = "anon"): Promise<ResearchState> {
  const key = userScopedKey(RESEARCH_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<ResearchState>(key);
    if (fromRedis) return fromRedis;

    const empty = { items: [], trendingHashtags: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, empty);
    return empty;
  }

  const fromFile = await readFileState(userId);
  if (fromFile) return fromFile;

  const empty = { items: [], trendingHashtags: [], updatedAt: new Date().toISOString() };
  await writeFileState(empty, userId);
  return empty;
}

export async function saveResearchState(state: ResearchState, userId = "anon"): Promise<void> {
  const key = userScopedKey(RESEARCH_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function getResearchSnapshot(userId = "anon"): Promise<ResearchState> {
  return loadResearchState(userId);
}

export async function replaceResearchSnapshot(input: {
  items: ResearchItem[];
  trendingHashtags: TrendingHashtag[];
}, userId = "anon"): Promise<ResearchState> {
  const next: ResearchState = {
    items: input.items,
    trendingHashtags: input.trendingHashtags,
    updatedAt: new Date().toISOString(),
  };

  await saveResearchState(next, userId);
  return next;
}
