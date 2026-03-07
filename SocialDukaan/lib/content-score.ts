import { validateContentGuardrails } from "@/lib/content-guardrails";
import { listExperiments } from "@/lib/experiment-store";

export type ScoreChannel = "instagram" | "facebook" | "linkedin" | "twitter";

export interface ScoreReason {
  key: string;
  label: string;
  status: "good" | "warn" | "bad";
  score: number;
  tip: string;
}

export interface ContentScoreResult {
  score: number;
  grade: "A" | "B" | "C";
  predictedBand: "high" | "medium" | "low";
  reasons: ScoreReason[];
  improveActions: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sentenceCount(text: string): number {
  const parts = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  return parts.length || 1;
}

function wordCount(text: string): number {
  return text.split(/\s+/).map((s) => s.trim()).filter(Boolean).length;
}

function hashtags(text: string): string[] {
  return text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
}

function hasStrongHook(text: string): boolean {
  const firstLine = text.split("\n")[0]?.trim().toLowerCase() || "";
  if (!firstLine) return false;

  const patterns = [
    /\?$/,
    /\b(3|5|7|10|12)\b/,
    /\b(how to|mistake|secret|easy|simple|quick|avoid|best)\b/,
    /\b(why|what|stop|start)\b/,
  ];

  return patterns.some((re) => re.test(firstLine));
}

function ctaScore(text: string): number {
  const lowered = text.toLowerCase();
  const ctaPatterns = [
    "comment",
    "dm",
    "book now",
    "call now",
    "shop now",
    "order now",
    "whatsapp",
    "link in bio",
    "register",
    "save this",
    "share this",
  ];

  return ctaPatterns.some((p) => lowered.includes(p)) ? 100 : 45;
}

function indiaContextScore(text: string): number {
  const lowered = text.toLowerCase();
  const indiaSignals = [
    "india",
    "indian",
    "inr",
    "rs",
    "rupee",
    "whatsapp",
    "delhi",
    "mumbai",
    "bengaluru",
    "bangalore",
    "hyderabad",
    "pune",
    "chennai",
    "kolkata",
    "diwali",
    "holi",
    "navratri",
    "eid",
    "rakhi",
    "dussehra",
    "ganesh chaturthi",
  ];

  const matches = indiaSignals.filter((s) => lowered.includes(s)).length;
  if (matches >= 2) return 100;
  if (matches === 1) return 75;
  return 50;
}

function timingFitScore(scheduledAt?: string): number {
  if (!scheduledAt) return 70;

  const hour = new Date(scheduledAt).getHours();
  const likelyGood = (hour >= 8 && hour <= 11) || (hour >= 18 && hour <= 21);
  return likelyGood ? 95 : 60;
}

function hashtagScore(text: string, channel: ScoreChannel): number {
  const count = hashtags(text).length;

  if (channel === "instagram") {
    if (count >= 3 && count <= 8) return 95;
    if (count >= 1 && count <= 12) return 75;
    return 45;
  }

  if (count >= 1 && count <= 5) return 95;
  if (count <= 8) return 70;
  return 45;
}

function readabilityScore(text: string): number {
  const words = wordCount(text);
  const sentences = sentenceCount(text);
  const avg = words / Math.max(1, sentences);

  if (avg <= 16) return 95;
  if (avg <= 22) return 80;
  return 55;
}

function channelLengthScore(text: string, channel: ScoreChannel): number {
  const len = text.length;

  if (channel === "instagram") {
    if (len >= 100 && len <= 650) return 95;
    if (len <= 1000) return 80;
    return 55;
  }

  if (channel === "facebook") {
    if (len >= 80 && len <= 500) return 95;
    if (len <= 900) return 80;
    return 55;
  }

  if (channel === "linkedin") {
    if (len >= 150 && len <= 900) return 95;
    if (len <= 1300) return 80;
    return 60;
  }

  if (len >= 80 && len <= 260) return 95;
  if (len <= 400) return 75;
  return 55;
}

async function voiceFitScore(text: string, channel: ScoreChannel): Promise<number> {
  const completed = await listExperiments("completed");
  const winners = completed
    .filter((exp) => exp.channel === channel && exp.winner)
    .map((exp) => exp.variants.find((v) => v.key === exp.winner)?.caption || "")
    .filter((caption) => caption.trim().length > 0);

  if (winners.length === 0) return 75;

  const avgWinnerLength = Math.round(
    winners.reduce((sum, caption) => sum + caption.length, 0) / winners.length
  );

  const diff = Math.abs(text.length - avgWinnerLength);
  if (diff <= 80) return 95;
  if (diff <= 180) return 80;
  return 60;
}

function toStatus(score: number): "good" | "warn" | "bad" {
  if (score >= 85) return "good";
  if (score >= 65) return "warn";
  return "bad";
}

function weightedScore(reasons: ScoreReason[]): number {
  const weights: Record<string, number> = {
    hook: 0.16,
    clarity: 0.13,
    cta: 0.14,
    hashtag: 0.12,
    length: 0.11,
    timing: 0.11,
    india_context: 0.1,
    voice_fit: 0.13,
  };

  let total = 0;
  for (const reason of reasons) {
    total += reason.score * (weights[reason.key] ?? 0);
  }

  return Math.round(total);
}

function actionFromReasons(reasons: ScoreReason[]): string[] {
  const failing = reasons.filter((r) => r.status !== "good").sort((a, b) => a.score - b.score);
  const actions = failing.slice(0, 3).map((r) => r.tip);
  if (actions.length === 0) {
    return [
      "Post is in strong shape. Publish as-is or test one alternate hook for A/B learning.",
    ];
  }
  return actions;
}

export async function scoreContent(input: {
  caption: string;
  channel: ScoreChannel;
  imageUrl?: string;
  scheduledAt?: string;
}): Promise<ContentScoreResult> {
  const normalized = input.caption.replace(/\s+/g, " ").trim();
  const guardrails = validateContentGuardrails({
    caption: input.caption,
    imageUrl: input.imageUrl,
    channel: input.channel === "linkedin" || input.channel === "twitter" ? undefined : input.channel,
  });

  const hook = hasStrongHook(normalized) ? 95 : 55;
  const clarity = readabilityScore(normalized);
  const cta = ctaScore(normalized);
  const hashtag = hashtagScore(normalized, input.channel);
  const length = channelLengthScore(normalized, input.channel);
  const timing = timingFitScore(input.scheduledAt);
  const indiaContext = indiaContextScore(normalized);
  const voiceFit = await voiceFitScore(normalized, input.channel);

  const reasons: ScoreReason[] = [
    {
      key: "hook",
      label: "Opening Hook",
      status: toStatus(hook),
      score: hook,
      tip: "Start with a strong first line: use a question, number, or direct benefit.",
    },
    {
      key: "clarity",
      label: "Simple Language",
      status: toStatus(clarity),
      score: clarity,
      tip: "Use short sentences and simple words so first-time users understand instantly.",
    },
    {
      key: "cta",
      label: "Clear Next Step",
      status: toStatus(cta),
      score: cta,
      tip: "Add one clear CTA: comment, DM, WhatsApp, or book now.",
    },
    {
      key: "hashtag",
      label: "Hashtag Quality",
      status: toStatus(hashtag),
      score: hashtag,
      tip: "Use fewer but relevant hashtags. Aim 3-8 on Instagram and 1-5 on Facebook.",
    },
    {
      key: "length",
      label: "Length Fit",
      status: toStatus(length),
      score: length,
      tip: "Adjust caption length for channel. Keep it concise and value-first.",
    },
    {
      key: "timing",
      label: "Posting Time Fit",
      status: toStatus(timing),
      score: timing,
      tip: "Schedule around 8-11 AM or 6-9 PM for better India audience visibility.",
    },
    {
      key: "india_context",
      label: "India Market Relevance",
      status: toStatus(indiaContext),
      score: indiaContext,
      tip: "Add local context such as city, festival season, INR pricing, or WhatsApp flow.",
    },
    {
      key: "voice_fit",
      label: "Brand Voice Fit",
      status: toStatus(voiceFit),
      score: voiceFit,
      tip: "Align style with your best-performing past captions for this channel.",
    },
  ];

  let score = weightedScore(reasons);

  if (!guardrails.ok) {
    score = clamp(score - 25, 0, 100);
  } else if (guardrails.warnings.length > 0) {
    score = clamp(score - 8, 0, 100);
  }

  const grade: "A" | "B" | "C" = score >= 85 ? "A" : score >= 70 ? "B" : "C";
  const predictedBand: "high" | "medium" | "low" = score >= 85 ? "high" : score >= 70 ? "medium" : "low";

  const improveActions = actionFromReasons(reasons);

  if (!guardrails.ok) {
    improveActions.unshift(`Fix blocked issue: ${guardrails.errors[0]}`);
  }

  return {
    score,
    grade,
    predictedBand,
    reasons,
    improveActions,
  };
}
