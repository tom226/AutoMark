import { isRedisRestConfigured, redisDel, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { deleteFiles, getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

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

const ONBOARDING_FILE = "tasks/onboarding-profile.json";
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

export async function getOnboardingProfile(userId = "anon"): Promise<OnboardingProfile> {
  const key = userScopedKey(ONBOARDING_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(ONBOARDING_FILE, userId));

  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<OnboardingProfile>(key);
    if (fromRedis) return normalizeProfile(fromRedis);
    const normalized = normalizeProfile(DEFAULT_PROFILE);
    await redisSetJson(key, normalized);
    return normalized;
  }

  const fromFile = await readFirstExistingJson<Partial<OnboardingProfile>>(files);
  if (fromFile) return normalizeProfile(fromFile);

  const normalized = normalizeProfile(DEFAULT_PROFILE);
  try {
    await writeJsonWithFallback(files, normalized);
  } catch {
    // Vercel/serverless file systems may be read-only. Return default profile without persistence.
  }
  return normalized;
}

export async function saveOnboardingProfile(
  input: Partial<OnboardingProfile>,
  userId = "anon",
): Promise<OnboardingProfile> {
  const key = userScopedKey(ONBOARDING_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(ONBOARDING_FILE, userId));
  const current = await getOnboardingProfile(userId);

  const merged = normalizeProfile({
    ...current,
    ...input,
    completedAt:
      input.onboardingCompleted === false
        ? undefined
        : input.completedAt ?? current.completedAt,
  });

  if (isRedisRestConfigured()) {
    await redisSetJson(key, merged);
    return merged;
  }

  try {
    await writeJsonWithFallback(files, merged);
  } catch {
    // Allow onboarding flow to continue even when local file persistence is unavailable.
  }
  return merged;
}

export async function clearOnboardingProfile(userId = "anon"): Promise<OnboardingProfile> {
  const key = userScopedKey(ONBOARDING_KEY, userId);
  const files = getPersistentFileCandidates(userScopedRelativePath(ONBOARDING_FILE, userId));
  const normalized = normalizeProfile({
    ...DEFAULT_PROFILE,
    onboardingCompleted: false,
    completedAt: undefined,
  });

  if (isRedisRestConfigured()) {
    await redisDel(key);
    await redisSetJson(key, normalized);
    return normalized;
  }

  try {
    await deleteFiles(files);
    await writeJsonWithFallback(files, normalized);
  } catch {
    // Keep response usable even if file system persistence is unavailable.
  }

  return normalized;
}
