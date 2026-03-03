import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

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

const FILE_PATH = path.join(process.cwd(), "tasks", "topic-research.json");
const REDIS_KEY = "socialdukaan:topic-research";

function toKey(topic: string, location?: string): string {
  return `${topic.toLowerCase().trim()}::${(location ?? "global").toLowerCase().trim()}`;
}

async function readFileState(): Promise<TopicResearchState | null> {
  try {
    if (!fs.existsSync(FILE_PATH)) return null;
    const raw = await fs.promises.readFile(FILE_PATH, "utf-8");
    return JSON.parse(raw) as TopicResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: TopicResearchState): Promise<void> {
  await fs.promises.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.promises.writeFile(FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

async function loadState(): Promise<TopicResearchState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<TopicResearchState>(REDIS_KEY);
    if (fromRedis) return fromRedis;
    const fresh: TopicResearchState = { records: [], updatedAt: new Date().toISOString() };
    await redisSetJson(REDIS_KEY, fresh);
    return fresh;
  }

  const fromFile = await readFileState();
  if (fromFile) return fromFile;

  const fresh: TopicResearchState = { records: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh);
  return fresh;
}

async function saveState(state: TopicResearchState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(REDIS_KEY, next);
    return;
  }

  await writeFileState(next);
}

export async function getTopicResearch(topic: string, location?: string): Promise<TopicResearchRecord | null> {
  const state = await loadState();
  const key = toKey(topic, location);
  return state.records.find((record) => record.key === key) ?? null;
}

export async function saveTopicResearch(input: {
  topic: string;
  location?: string;
  insights: TopicResearchInsight[];
}): Promise<TopicResearchRecord> {
  const state = await loadState();
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

  await saveState(state);
  return record;
}
