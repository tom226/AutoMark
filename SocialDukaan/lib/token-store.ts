/**
 * Persistent token store.
 * - Production: Redis REST (KV_REST_API_URL + KV_REST_API_TOKEN)
 * - Local dev fallback: .tokens.json
 */
import fs from "fs";
import os from "os";
import path from "path";
import type { StoredTokens } from "./meta";
import {
  isRedisRestConfigured,
  redisDel,
  redisGetJson,
  redisSetJson,
} from "./redis-rest";

const LOCAL_TOKEN_FILE = path.join(process.cwd(), ".tokens.json");
const TMP_TOKEN_FILE = path.join(os.tmpdir(), "socialdukaan", ".tokens.json");

function isLikelyReadOnlyRuntime(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.AWS_EXECUTION_ENV) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    process.cwd().startsWith("/var/task")
  );
}

const TOKEN_KEY = "socialdukaan:tokens";

function getTokenFileCandidates(): string[] {
  return isLikelyReadOnlyRuntime()
    ? [TMP_TOKEN_FILE, LOCAL_TOKEN_FILE]
    : [LOCAL_TOKEN_FILE, TMP_TOKEN_FILE];
}

function isReadOnlyFsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (isRedisRestConfigured()) {
    await redisSetJson(TOKEN_KEY, tokens);
    return;
  }

  const payload = JSON.stringify(tokens, null, 2);
  const candidates = getTokenFileCandidates();

  let lastError: unknown;
  for (const file of candidates) {
    try {
      await fs.promises.mkdir(path.dirname(file), { recursive: true });
      await fs.promises.writeFile(file, payload, "utf-8");
      return;
    } catch (error) {
      lastError = error;
      if (!isReadOnlyFsError(error)) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to persist tokens");
}

export async function loadTokens(): Promise<StoredTokens | null> {
  if (isRedisRestConfigured()) {
    return redisGetJson<StoredTokens>(TOKEN_KEY);
  }

  for (const file of getTokenFileCandidates()) {
    try {
      if (!fs.existsSync(file)) continue;
      const raw = await fs.promises.readFile(file, "utf-8");
      return JSON.parse(raw) as StoredTokens;
    } catch {
      // try next location
    }
  }

  return null;
}

export async function clearTokens(): Promise<void> {
  if (isRedisRestConfigured()) {
    await redisDel(TOKEN_KEY);
    return;
  }

  for (const file of getTokenFileCandidates()) {
    try {
      if (fs.existsSync(file)) {
        await fs.promises.unlink(file);
      }
    } catch {
      // ignore
    }
  }
}
