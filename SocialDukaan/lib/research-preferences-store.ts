import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export interface ResearchPreferences {
  platforms: string[];
  categories: string[];
  categoryWeights: Record<string, number>;
  customHashtags: string[];
  updatedAt: string;
}

const PREFS_FILE = "tasks/research-preferences.json";
const PREFS_KEY = "socialdukaan:research-preferences";

function getPrefsFilePath(userId = "anon"): string {
  return path.join(process.cwd(), userScopedRelativePath(PREFS_FILE, userId));
}

const DEFAULT_PREFS: ResearchPreferences = {
  platforms: ["instagram", "facebook"],
  categories: ["marketing", "business"],
  categoryWeights: {
    marketing: 3,
    business: 3,
  },
  customHashtags: [],
  updatedAt: new Date().toISOString(),
};

function normalizeTag(tag: string): string {
  const clean = tag.trim().toLowerCase().replace(/\s+/g, "");
  if (!clean) return "";
  return clean.startsWith("#") ? clean : `#${clean}`;
}

function normalizePrefs(input?: Partial<ResearchPreferences>): ResearchPreferences {
  const platforms = [...new Set((input?.platforms ?? DEFAULT_PREFS.platforms).map((item) => item.trim().toLowerCase()).filter(Boolean))];
  const categories = [...new Set((input?.categories ?? DEFAULT_PREFS.categories).map((item) => item.trim().toLowerCase()).filter(Boolean))];
  const sourceWeights = input?.categoryWeights ?? DEFAULT_PREFS.categoryWeights;
  const categoryWeights: Record<string, number> = {};
  for (const category of categories) {
    const raw = Number(sourceWeights?.[category] ?? DEFAULT_PREFS.categoryWeights[category] ?? 3);
    categoryWeights[category] = Math.max(1, Math.min(5, Number.isFinite(raw) ? Math.round(raw) : 3));
  }
  const customHashtags = [...new Set((input?.customHashtags ?? []).map(normalizeTag).filter((item) => item.length > 1))].slice(0, 30);

  return {
    platforms,
    categories,
    categoryWeights,
    customHashtags,
    updatedAt: new Date().toISOString(),
  };
}

async function readFilePrefs(userId = "anon"): Promise<ResearchPreferences | null> {
  const filePath = getPrefsFilePath(userId);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = await fs.promises.readFile(filePath, "utf-8");
    return normalizePrefs(JSON.parse(raw) as Partial<ResearchPreferences>);
  } catch {
    return null;
  }
}

async function writeFilePrefs(prefs: ResearchPreferences, userId = "anon"): Promise<void> {
  const filePath = getPrefsFilePath(userId);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, JSON.stringify(prefs, null, 2), "utf-8");
}

export async function getResearchPreferences(userId = "anon"): Promise<ResearchPreferences> {
  const key = userScopedKey(PREFS_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<ResearchPreferences>(key);
    if (fromRedis) return normalizePrefs(fromRedis);
    const normalized = normalizePrefs(DEFAULT_PREFS);
    await redisSetJson(key, normalized);
    return normalized;
  }

  const fromFile = await readFilePrefs(userId);
  if (fromFile) return fromFile;

  const normalized = normalizePrefs(DEFAULT_PREFS);
  await writeFilePrefs(normalized, userId);
  return normalized;
}

export async function saveResearchPreferences(input: Partial<ResearchPreferences>, userId = "anon"): Promise<ResearchPreferences> {
  const key = userScopedKey(PREFS_KEY, userId);
  const current = await getResearchPreferences(userId);
  const merged = normalizePrefs({
    platforms: input.platforms ?? current.platforms,
    categories: input.categories ?? current.categories,
    categoryWeights: input.categoryWeights ?? current.categoryWeights,
    customHashtags: input.customHashtags ?? current.customHashtags,
    updatedAt: new Date().toISOString(),
  });

  if (isRedisRestConfigured()) {
    await redisSetJson(key, merged);
    return merged;
  }

  await writeFilePrefs(merged, userId);
  return merged;
}
