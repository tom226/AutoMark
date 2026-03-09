import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

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

const TASK_FILE = "tasks/weekly-content.json";
const TASK_KEY = "socialdukaan:weekly-tasks";

function getTaskFilePath(userId = "anon"): string {
  return path.join(process.cwd(), userScopedRelativePath(TASK_FILE, userId));
}

async function readFileState(userId = "anon"): Promise<TaskFolderState | null> {
  const filePath = getTaskFilePath(userId);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return JSON.parse(raw) as TaskFolderState;
  } catch {
    return null;
  }
}

async function writeFileState(state: TaskFolderState, userId = "anon"): Promise<void> {
  const filePath = getTaskFilePath(userId);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(state, null, 2), "utf-8");
}

export async function loadTaskFolderState(userId = "anon"): Promise<TaskFolderState> {
  const key = userScopedKey(TASK_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<TaskFolderState>(key);
    if (fromRedis) return fromRedis;

    const fresh = { tasks: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, fresh);
    return fresh;
  }

  const fromFile = await readFileState(userId);
  if (fromFile) return fromFile;

  const fresh = { tasks: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh, userId);
  return fresh;
}

export async function saveTaskFolderState(state: TaskFolderState, userId = "anon"): Promise<void> {
  const key = userScopedKey(TASK_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function listWeeklyTasks(userId = "anon"): Promise<WeeklyContentTask[]> {
  const state = await loadTaskFolderState(userId);
  return [...state.tasks].sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
}

export async function upsertWeeklyTasks(tasks: WeeklyContentTask[], userId = "anon"): Promise<void> {
  const state = await loadTaskFolderState(userId);
  const map = new Map(state.tasks.map((task) => [task.id, task]));

  for (const task of tasks) {
    map.set(task.id, task);
  }

  state.tasks = Array.from(map.values());
  await saveTaskFolderState(state, userId);
}

export async function updateWeeklyTask(
  id: string,
  patch: Partial<WeeklyContentTask>,
  userId = "anon",
): Promise<WeeklyContentTask | null> {
  const state = await loadTaskFolderState(userId);
  const target = state.tasks.find((task) => task.id === id);
  if (!target) return null;

  Object.assign(target, patch);
  await saveTaskFolderState(state, userId);
  return target;
}

export async function deleteWeeklyTask(id: string, userId = "anon"): Promise<boolean> {
  const state = await loadTaskFolderState(userId);
  const before = state.tasks.length;
  state.tasks = state.tasks.filter((task) => task.id !== id);
  if (state.tasks.length === before) return false;

  await saveTaskFolderState(state, userId);
  return true;
}
