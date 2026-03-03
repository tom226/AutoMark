const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

export function isRedisRestConfigured(): boolean {
  return Boolean(KV_URL && KV_TOKEN);
}

async function callRedis<T>(command: string[]): Promise<T | null> {
  if (!KV_URL || !KV_TOKEN) return null;

  const endpoint = `${KV_URL}/${command.map(encodeURIComponent).join("/")}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Redis REST request failed: ${response.status}`);
  }

  const data = (await response.json()) as { result?: T };
  return data.result ?? null;
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const raw = await callRedis<string>(["get", key]);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

export async function redisSetJson<T>(key: string, value: T): Promise<void> {
  await callRedis<string>(["set", key, JSON.stringify(value)]);
}

export async function redisDel(key: string): Promise<void> {
  await callRedis<number>(["del", key]);
}
