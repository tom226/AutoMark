import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

export type TaskStatus = "review" | "upcoming" | "posted" | "rejected";

export interface WeeklyContentTask {
  id: string;
  channel: "instagram" | "facebook";
  pageId: string;
  pageName: string;
  accountHandle: string;
  competitorHandle: string;
  caption: string;
  research?: {
    title?: string;
    summary?: string;
    sourceUrl?: string;
    inferredTopic?: string;
    basedOn?: string[];
  };
  imageUrl?: string;
  scheduledAt: string;
  status: TaskStatus;
  createdAt: string;
  postedAt?: string;
  error?: string;
}

interface TaskFolderState {
  tasks: WeeklyContentTask[];
  updatedAt: string;
}

const TASK_DIR = path.join(process.cwd(), "tasks");
const TASK_FILE = path.join(TASK_DIR, "weekly-content.json");
const TASK_KEY = "socialdukaan:weekly-tasks";

async function readFileState(): Promise<TaskFolderState | null> {
  try {
    if (!fs.existsSync(TASK_FILE)) return null;
    const raw = await fs.promises.readFile(TASK_FILE, "utf-8");
    return JSON.parse(raw) as TaskFolderState;
  } catch {
    return null;
  }
}

async function writeFileState(state: TaskFolderState): Promise<void> {
  await fs.promises.mkdir(TASK_DIR, { recursive: true });
  await fs.promises.writeFile(TASK_FILE, JSON.stringify(state, null, 2), "utf-8");
}

export async function loadTaskFolderState(): Promise<TaskFolderState> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<TaskFolderState>(TASK_KEY);
    if (fromRedis) return fromRedis;

    const fresh = { tasks: [], updatedAt: new Date().toISOString() };
    await redisSetJson(TASK_KEY, fresh);
    return fresh;
  }

  const fromFile = await readFileState();
  if (fromFile) return fromFile;

  const fresh = { tasks: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh);
  return fresh;
}

export async function saveTaskFolderState(state: TaskFolderState): Promise<void> {
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(TASK_KEY, next);
    return;
  }

  await writeFileState(next);
}

export async function listWeeklyTasks(): Promise<WeeklyContentTask[]> {
  const state = await loadTaskFolderState();
  return [...state.tasks].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
}

export async function upsertWeeklyTasks(tasks: WeeklyContentTask[]): Promise<void> {
  const state = await loadTaskFolderState();
  const map = new Map(state.tasks.map((task) => [task.id, task]));

  for (const task of tasks) {
    map.set(task.id, task);
  }

  state.tasks = Array.from(map.values());
  await saveTaskFolderState(state);
}

export async function updateWeeklyTask(
  id: string,
  patch: Partial<WeeklyContentTask>
): Promise<WeeklyContentTask | null> {
  const state = await loadTaskFolderState();
  const target = state.tasks.find((task) => task.id === id);
  if (!target) return null;

  Object.assign(target, patch);
  await saveTaskFolderState(state);
  return target;
}

export async function deleteWeeklyTask(id: string): Promise<boolean> {
  const state = await loadTaskFolderState();
  const before = state.tasks.length;
  state.tasks = state.tasks.filter((task) => task.id !== id);
  if (state.tasks.length === before) return false;

  await saveTaskFolderState(state);
  return true;
}
