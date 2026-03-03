/**
 * Persistent token store.
 * - Production: Redis REST (KV_REST_API_URL + KV_REST_API_TOKEN)
 * - Local dev fallback: .tokens.json
 */
import fs from "fs";
import path from "path";
import type { StoredTokens } from "./meta";
import {
  isRedisRestConfigured,
  redisDel,
  redisGetJson,
  redisSetJson,
} from "./redis-rest";

const TOKEN_FILE = path.join(process.cwd(), ".tokens.json");
const TOKEN_KEY = "socialdukaan:tokens";

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  if (isRedisRestConfigured()) {
    await redisSetJson(TOKEN_KEY, tokens);
    return;
  }

  await fs.promises.writeFile(TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function loadTokens(): Promise<StoredTokens | null> {
  if (isRedisRestConfigured()) {
    return redisGetJson<StoredTokens>(TOKEN_KEY);
  }

  try {
    if (!fs.existsSync(TOKEN_FILE)) return null;
    const raw = await fs.promises.readFile(TOKEN_FILE, "utf-8");
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

export async function clearTokens(): Promise<void> {
  if (isRedisRestConfigured()) {
    await redisDel(TOKEN_KEY);
    return;
  }

  try {
    if (fs.existsSync(TOKEN_FILE)) {
      await fs.promises.unlink(TOKEN_FILE);
    }
  } catch {
    // ignore
  }
}
