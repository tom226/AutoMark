import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

export interface ResearchPreferences {
  platforms: string[];
  categories: string[];
  categoryWeights: Record<string, number>;
  customHashtags: string[];
  updatedAt: string;
}

const PREFS_FILE = path.join(process.cwd(), "tasks", "research-preferences.json");
const PREFS_KEY = "socialdukaan:research-preferences";

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

async function readFilePrefs(): Promise<ResearchPreferences | null> {
  try {
    if (!fs.existsSync(PREFS_FILE)) return null;
    const raw = await fs.promises.readFile(PREFS_FILE, "utf-8");
    return normalizePrefs(JSON.parse(raw) as Partial<ResearchPreferences>);
  } catch {
    return null;
  }
}

async function writeFilePrefs(prefs: ResearchPreferences): Promise<void> {
  await fs.promises.mkdir(path.dirname(PREFS_FILE), { recursive: true });
  await fs.promises.writeFile(PREFS_FILE, JSON.stringify(prefs, null, 2), "utf-8");
}

export async function getResearchPreferences(): Promise<ResearchPreferences> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<ResearchPreferences>(PREFS_KEY);
    if (fromRedis) return normalizePrefs(fromRedis);
    const normalized = normalizePrefs(DEFAULT_PREFS);
    await redisSetJson(PREFS_KEY, normalized);
    return normalized;
  }

  const fromFile = await readFilePrefs();
  if (fromFile) return fromFile;

  const normalized = normalizePrefs(DEFAULT_PREFS);
  await writeFilePrefs(normalized);
  return normalized;
}

export async function saveResearchPreferences(input: Partial<ResearchPreferences>): Promise<ResearchPreferences> {
  const current = await getResearchPreferences();
  const merged = normalizePrefs({
    platforms: input.platforms ?? current.platforms,
    categories: input.categories ?? current.categories,
    categoryWeights: input.categoryWeights ?? current.categoryWeights,
    customHashtags: input.customHashtags ?? current.customHashtags,
    updatedAt: new Date().toISOString(),
  });

  if (isRedisRestConfigured()) {
    await redisSetJson(PREFS_KEY, merged);
    return merged;
  }

  await writeFilePrefs(merged);
  return merged;
}
