import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export interface ResearchedRunningEvent {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  summary?: string;
}

export interface EventResearchRecord {
  key: string;
  topic: string;
  location: string;
  events: ResearchedRunningEvent[];
  updatedAt: string;
}

interface EventResearchState {
  records: EventResearchRecord[];
  updatedAt: string;
}

const RESEARCH_FILE = "tasks/event-research.json";
const RESEARCH_KEY = "socialdukaan:event-research";

function getResearchFilePath(userId = "anon"): string {
  return path.join(process.cwd(), userScopedRelativePath(RESEARCH_FILE, userId));
}

function makeKey(topic: string, location: string): string {
  return `${topic.toLowerCase().trim()}::${location.toLowerCase().trim()}`;
}

async function readFileState(userId = "anon"): Promise<EventResearchState | null> {
  const filePath = getResearchFilePath(userId);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(raw) as EventResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: EventResearchState, userId = "anon"): Promise<void> {
  const filePath = getResearchFilePath(userId);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

async function loadState(userId = "anon"): Promise<EventResearchState> {
  const key = userScopedKey(RESEARCH_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<EventResearchState>(key);
    if (fromRedis) return fromRedis;
    const fresh: EventResearchState = { records: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, fresh);
    return fresh;
  }

  const fromFile = await readFileState(userId);
  if (fromFile) return fromFile;

  const fresh: EventResearchState = { records: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh, userId);
  return fresh;
}

async function saveState(state: EventResearchState, userId = "anon"): Promise<void> {
  const key = userScopedKey(RESEARCH_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function getStoredEventResearch(topic: string, location: string, userId = "anon"): Promise<EventResearchRecord | null> {
  const state = await loadState(userId);
  const key = makeKey(topic, location);
  return state.records.find((record) => record.key === key) ?? null;
}

export async function saveEventResearch(input: {
  topic: string;
  location: string;
  events: ResearchedRunningEvent[];
}, userId = "anon"): Promise<EventResearchRecord> {
  const state = await loadState(userId);
  const key = makeKey(input.topic, input.location);

  const record: EventResearchRecord = {
    key,
    topic: input.topic,
    location: input.location,
    events: input.events,
    updatedAt: new Date().toISOString(),
  };

  const idx = state.records.findIndex((item) => item.key === key);
  if (idx >= 0) {
    state.records[idx] = record;
  } else {
    state.records.push(record);
  }

  await saveState(state, userId);
  return record;
}
