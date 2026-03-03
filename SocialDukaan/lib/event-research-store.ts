import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

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

const RESEARCH_DIR = path.join(process.cwd(), "tasks");
const RESEARCH_FILE = path.join(RESEARCH_DIR, "event-research.json");
const RESEARCH_KEY = "socialdukaan:event-research";

function makeKey(topic: string, location: string): string {
  return `${topic.toLowerCase().trim()}::${location.toLowerCase().trim()}`;
}

async function readFileState(): Promise<EventResearchState | null> {
  try {
    if (!fs.existsSync(RESEARCH_FILE)) return null;
    const raw = await fs.promises.readFile(RESEARCH_FILE, "utf-8");
    return JSON.parse(raw) as EventResearchState;
  } catch {
    return null;
  }
}

async function writeFileState(state: EventResearchState): Promise<void> {
  await fs.promises.mkdir(RESEARCH_DIR, { recursive: true });
  await fs.promises.writeFile(RESEARCH_FILE, JSON.stringify(state, null, 2), "utf-8");
}

async function loadState(): Promise<EventResearchState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<EventResearchState>(RESEARCH_KEY);
    if (fromRedis) return fromRedis;
    const fresh: EventResearchState = { records: [], updatedAt: new Date().toISOString() };
    await redisSetJson(RESEARCH_KEY, fresh);
    return fresh;
  }

  const fromFile = await readFileState();
  if (fromFile) return fromFile;

  const fresh: EventResearchState = { records: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh);
  return fresh;
}

async function saveState(state: EventResearchState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(RESEARCH_KEY, next);
    return;
  }

  await writeFileState(next);
}

export async function getStoredEventResearch(topic: string, location: string): Promise<EventResearchRecord | null> {
  const state = await loadState();
  const key = makeKey(topic, location);
  return state.records.find((record) => record.key === key) ?? null;
}

export async function saveEventResearch(input: {
  topic: string;
  location: string;
  events: ResearchedRunningEvent[];
}): Promise<EventResearchRecord> {
  const state = await loadState();
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

  await saveState(state);
  return record;
}
