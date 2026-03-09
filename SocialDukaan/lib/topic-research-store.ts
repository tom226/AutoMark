import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export interface TopicResearchInsight {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
}

export interface TopicResearchRecord {
  key: string;
  topic: string;
  location?: string;
  insights: TopicResearchInsight[];
  updatedAt: string;
}

interface TopicResearchState {
  records: TopicResearchRecord[];
  updatedAt: string;
}

const FILE_PATH = "tasks/topic-research.json";
const REDIS_KEY = "socialdukaan:topic-research";

function getFilePath(userId = "anon"): string {
  return path.join(process.cwd(), userScopedRelativePath(FILE_PATH, userId));
}

function toKey(topic: string, location?: string): string {
  return `${topic.toLowerCase().trim()}::${(location ?? "global").toLowerCase().trim()}`;
}

async function readFileState(userId = "anon"): Promise<TopicResearchState | null> {
  const filePath = getFilePath(userId);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(raw) as TopicResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: TopicResearchState, userId = "anon"): Promise<void> {
  const filePath = getFilePath(userId);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

async function loadState(userId = "anon"): Promise<TopicResearchState> {
  const key = userScopedKey(REDIS_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<TopicResearchState>(key);
    if (fromRedis) return fromRedis;
    const fresh: TopicResearchState = { records: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, fresh);
    return fresh;
  }

  const fromFile = await readFileState(userId);
  if (fromFile) return fromFile;

  const fresh: TopicResearchState = { records: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh, userId);
  return fresh;
}

async function saveState(state: TopicResearchState, userId = "anon"): Promise<void> {
  const key = userScopedKey(REDIS_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function getTopicResearch(topic: string, location?: string, userId = "anon"): Promise<TopicResearchRecord | null> {
  const state = await loadState(userId);
  const key = toKey(topic, location);
  return state.records.find((record) => record.key === key) ?? null;
}

export async function saveTopicResearch(input: {
  topic: string;
  location?: string;
  insights: TopicResearchInsight[];
}, userId = "anon"): Promise<TopicResearchRecord> {
  const state = await loadState(userId);
  const key = toKey(input.topic, input.location);

  const record: TopicResearchRecord = {
    key,
    topic: input.topic,
    location: input.location,
    insights: input.insights,
    updatedAt: new Date().toISOString(),
  };

  const idx = state.records.findIndex((item) => item.key === key);
  if (idx >= 0) state.records[idx] = record;
  else state.records.push(record);

  await saveState(state, userId);
  return record;
}
