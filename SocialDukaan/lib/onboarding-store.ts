import fs from "fs";
import path from "path";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";

export type PreferredLanguage = "english" | "hindi" | "hinglish";
export type PrimaryObjective = "sales" | "followers" | "messages" | "awareness";

export interface OnboardingProfile {
  businessName: string;
  businessType: string;
  niche: string;
  preferredLanguage: PreferredLanguage;
  postingGoal: number;
  primaryObjective: PrimaryObjective;
  timezone: string;
  onboardingCompleted: boolean;
  completedAt?: string;
  updatedAt: string;
}

const ONBOARDING_FILE = path.join(process.cwd(), "tasks", "onboarding-profile.json");
const ONBOARDING_KEY = "socialdukaan:onboarding-profile";

const DEFAULT_PROFILE: OnboardingProfile = {
  businessName: "",
  businessType: "",
  niche: "",
  preferredLanguage: "english",
  postingGoal: 4,
  primaryObjective: "sales",
  timezone: "Asia/Kolkata",
  onboardingCompleted: false,
  completedAt: undefined,
  updatedAt: new Date().toISOString(),
};

function clampPostingGoal(value: number): number {
  if (!Number.isFinite(value)) return 4;
  return Math.max(1, Math.min(21, Math.round(value)));
}

function normalizeProfile(input?: Partial<OnboardingProfile>): OnboardingProfile {
  const businessName = (input?.businessName ?? DEFAULT_PROFILE.businessName).trim().slice(0, 80);
  const businessType = (input?.businessType ?? DEFAULT_PROFILE.businessType).trim().toLowerCase().slice(0, 50);
  const niche = (input?.niche ?? DEFAULT_PROFILE.niche).trim().slice(0, 120);

  const preferredLanguageRaw = (input?.preferredLanguage ?? DEFAULT_PROFILE.preferredLanguage).toLowerCase();
  const preferredLanguage: PreferredLanguage =
    preferredLanguageRaw === "hindi" || preferredLanguageRaw === "hinglish" ? preferredLanguageRaw : "english";

  const objectiveRaw = (input?.primaryObjective ?? DEFAULT_PROFILE.primaryObjective).toLowerCase();
  const primaryObjective: PrimaryObjective =
    objectiveRaw === "followers" || objectiveRaw === "messages" || objectiveRaw === "awareness"
      ? objectiveRaw
      : "sales";

  const timezone = (input?.timezone ?? DEFAULT_PROFILE.timezone).trim() || "Asia/Kolkata";
  const postingGoal = clampPostingGoal(Number(input?.postingGoal ?? DEFAULT_PROFILE.postingGoal));
  const onboardingCompleted = Boolean(input?.onboardingCompleted);

  return {
    businessName,
    businessType,
    niche,
    preferredLanguage,
    postingGoal,
    primaryObjective,
    timezone,
    onboardingCompleted,
    completedAt: onboardingCompleted ? input?.completedAt ?? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
}

async function readProfileFromFile(): Promise<OnboardingProfile | null> {
  try {
    if (!fs.existsSync(ONBOARDING_FILE)) return null;
    const raw = await fs.promises.readFile(ONBOARDING_FILE, "utf-8");
    return normalizeProfile(JSON.parse(raw) as Partial<OnboardingProfile>);
  } catch {
    return null;
  }
}

async function writeProfileToFile(profile: OnboardingProfile): Promise<void> {
  await fs.promises.mkdir(path.dirname(ONBOARDING_FILE), { recursive: true });
  await fs.promises.writeFile(ONBOARDING_FILE, JSON.stringify(profile, null, 2), "utf-8");
}

export async function getOnboardingProfile(): Promise<OnboardingProfile> {
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<OnboardingProfile>(ONBOARDING_KEY);
    if (fromRedis) return normalizeProfile(fromRedis);
    const normalized = normalizeProfile(DEFAULT_PROFILE);
    await redisSetJson(ONBOARDING_KEY, normalized);
    return normalized;
  }

  const fromFile = await readProfileFromFile();
  if (fromFile) return fromFile;

  const normalized = normalizeProfile(DEFAULT_PROFILE);
  await writeProfileToFile(normalized);
  return normalized;
}

export async function saveOnboardingProfile(
  input: Partial<OnboardingProfile>,
): Promise<OnboardingProfile> {
  const current = await getOnboardingProfile();

  const merged = normalizeProfile({
    ...current,
    ...input,
    completedAt:
      input.onboardingCompleted === false
        ? undefined
        : input.completedAt ?? current.completedAt,
  });

  if (isRedisRestConfigured()) {
    await redisSetJson(ONBOARDING_KEY, merged);
    return merged;
  }

  await writeProfileToFile(merged);
  return merged;
}
