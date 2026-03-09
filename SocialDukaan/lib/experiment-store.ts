import fs from "fs";
import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import type { Experiment, ExperimentVariantKey } from "@/lib/types";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

interface ExperimentState {
  experiments: Experiment[];
  updatedAt: string;
}

const EXPERIMENT_FILE = ".experiments.json";
const EXPERIMENTS_KEY = "socialdukaan:experiments";

function rewriteCaptionForVariant(baseCaption: string): string {
  const trimmed = baseCaption.trim();
  if (!trimmed) {
    return "Fresh take: focus on one clear value, one proof point, and one CTA.";
  }

  if (trimmed.length > 140) {
    return `${trimmed.slice(0, 130)}...\n\nTry this approach today and share your result.`;
  }

  return `${trimmed}\n\nQuick challenge: apply this in your next post and tell us what changed.`;
}

async function readFileState(userId = "anon"): Promise<ExperimentState | null> {
  const files = getPersistentFileCandidates(userScopedRelativePath(EXPERIMENT_FILE, userId));
  try {
    return await readFirstExistingJson<ExperimentState>(files);
  } catch {
    return null;
  }
}

async function writeFileState(state: ExperimentState, userId = "anon"): Promise<void> {
  const files = getPersistentFileCandidates(userScopedRelativePath(EXPERIMENT_FILE, userId));
  await writeJsonWithFallback(files, state);
}

export async function loadExperimentState(userId = "anon"): Promise<ExperimentState> {
  const key = userScopedKey(EXPERIMENTS_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<ExperimentState>(key);
    if (fromRedis) return fromRedis;
    const fresh = { experiments: [], updatedAt: new Date().toISOString() };
    await redisSetJson(key, fresh);
    return fresh;
  }

  const fromFile = await readFileState(userId);
  if (fromFile) return fromFile;

  const fresh = { experiments: [], updatedAt: new Date().toISOString() };
  await writeFileState(fresh, userId);
  return fresh;
}

export async function saveExperimentState(state: ExperimentState, userId = "anon"): Promise<void> {
  const key = userScopedKey(EXPERIMENTS_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };
  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function createExperiment(input: {
  channel: Experiment["channel"];
  pageId?: string;
  topic?: string;
  baseCaption: string;
  variantB?: string;
}, userId = "anon"): Promise<Experiment> {
  const state = await loadExperimentState(userId);
  const experiment: Experiment = {
    id: `exp-${Date.now()}`,
    channel: input.channel,
    pageId: input.pageId,
    topic: input.topic,
    status: "running",
    variants: [
      {
        key: "A",
        caption: input.baseCaption.trim(),
        impressions: 0,
        engagements: 0,
      },
      {
        key: "B",
        caption: (input.variantB ?? rewriteCaptionForVariant(input.baseCaption)).trim(),
        impressions: 0,
        engagements: 0,
      },
    ],
    createdAt: new Date().toISOString(),
  };

  state.experiments.unshift(experiment);
  await saveExperimentState(state, userId);
  return experiment;
}

export async function listExperiments(status?: "running" | "completed", userId = "anon"): Promise<Experiment[]> {
  const state = await loadExperimentState(userId);
  const ordered = [...state.experiments].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
  );

  if (!status) return ordered;
  return ordered.filter((item) => item.status === status);
}

export async function updateExperimentMetrics(input: {
  experimentId: string;
  variant: ExperimentVariantKey;
  impressions: number;
  engagements: number;
}, userId = "anon"): Promise<Experiment | null> {
  const state = await loadExperimentState(userId);
  const target = state.experiments.find((item) => item.id === input.experimentId);
  if (!target) return null;

  target.variants = target.variants.map((variant) =>
    variant.key === input.variant
      ? {
          ...variant,
          impressions: Math.max(0, Math.floor(input.impressions)),
          engagements: Math.max(0, Math.floor(input.engagements)),
        }
      : variant
  ) as [Experiment["variants"][number], Experiment["variants"][number]];

  await saveExperimentState(state, userId);
  return target;
}

function engagementRate(impressions: number, engagements: number): number {
  if (impressions <= 0) return 0;
  return engagements / impressions;
}

export async function evaluateExperiment(experimentId: string, userId = "anon"): Promise<Experiment | null> {
  const state = await loadExperimentState(userId);
  const target = state.experiments.find((item) => item.id === experimentId);
  if (!target) return null;

  const [a, b] = target.variants;
  const rateA = engagementRate(a.impressions, a.engagements);
  const rateB = engagementRate(b.impressions, b.engagements);

  target.winner = rateA >= rateB ? "A" : "B";
  target.status = "completed";
  target.completedAt = new Date().toISOString();

  await saveExperimentState(state, userId);
  return target;
}

export async function getLatestWinnerCaption(input: {
  channel: Experiment["channel"];
  pageId?: string;
}, userId = "anon"): Promise<string | null> {
  const state = await loadExperimentState(userId);

  const completed = state.experiments
    .filter((experiment) => {
      if (experiment.status !== "completed") return false;
      if (!experiment.winner) return false;
      if (experiment.channel !== input.channel) return false;
      if (input.pageId && experiment.pageId && experiment.pageId !== input.pageId) return false;
      return true;
    })
    .sort((a, b) => +new Date(b.completedAt ?? b.createdAt) - +new Date(a.completedAt ?? a.createdAt));

  const latest = completed[0];
  if (!latest || !latest.winner) return null;

  const winnerVariant = latest.variants.find((variant) => variant.key === latest.winner);
  return winnerVariant?.caption?.trim() || null;
}
