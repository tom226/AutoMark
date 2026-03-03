import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

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

const RESEARCH_FILE = path.join(process.cwd(), "tasks", "research-cache.json");
const RESEARCH_KEY = "socialdukaan:research-cache";

async function readFileState(): Promise<ResearchState | null> {
  try {
    if (!fs.existsSync(RESEARCH_FILE)) return null;
    const raw = await fs.promises.readFile(RESEARCH_FILE, "utf-8");
    return JSON.parse(raw) as ResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: ResearchState): Promise<void> {
  await fs.promises.mkdir(path.dirname(RESEARCH_FILE), { recursive: true });
  await fs.promises.writeFile(RESEARCH_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function loadResearchState(): Promise<ResearchState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<ResearchState>(RESEARCH_KEY);
    if (fromRedis) return fromRedis;

    const empty = { items: [], trendingHashtags: [], updatedAt: new Date().toISOString() };
    await redisSetJson(RESEARCH_KEY, empty);
    return empty;
  }

  const fromFile = await readFileState();
  if (fromFile) return fromFile;

  const empty = { items: [], trendingHashtags: [], updatedAt: new Date().toISOString() };
  await writeFileState(empty);
  return empty;
}

export async function saveResearchState(state: ResearchState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(RESEARCH_KEY, next);
    return;
  }

  await writeFileState(next);
}

export async function getResearchSnapshot(): Promise<ResearchState> {
  return loadResearchState();
}

export async function replaceResearchSnapshot(input: {
  items: ResearchItem[];
  trendingHashtags: TrendingHashtag[];
}): Promise<ResearchState> {
  const next: ResearchState = {
    items: input.items,
    trendingHashtags: input.trendingHashtags,
    updatedAt: new Date().toISOString(),
  };

  await saveResearchState(next);
  return next;
}
