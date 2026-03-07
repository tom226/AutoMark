import { scoreContent, type ScoreChannel } from "@/lib/content-score";

export interface ContentFixResult {
  improvedCaption: string;
  appliedFixes: string[];
  beforeScore?: number;
  afterScore?: number;
}

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function ensureHook(text: string): { text: string; changed: boolean } {
  const firstLine = text.split("\n")[0]?.trim() ?? "";
  if (/\?|\b(5|7|10)\b|\bhow to\b/i.test(firstLine)) {
    return { text, changed: false };
  }

  const hook = "Struggling to get better engagement? Try this simple method.";
  return { text: `${hook}\n\n${text}`, changed: true };
}

function ensureCta(text: string): { text: string; changed: boolean } {
  if (/(comment|dm|whatsapp|book now|order now|save this|share this|register)/i.test(text)) {
    return { text, changed: false };
  }

  const cta = "Comment \"GUIDE\" or WhatsApp us to get the full checklist.";
  return { text: `${text}\n\n${cta}`, changed: true };
}

function fixHashtags(text: string, channel: ScoreChannel): { text: string; changed: boolean } {
  const tags = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const body = text.replace(/\s*#[\p{L}\p{N}_]+/gu, "").trim();
  const unique = [...new Set(tags.map((t) => t.toLowerCase()))];

  const desired = channel === "instagram" ? 5 : 3;
  const defaults = channel === "instagram"
    ? ["#india", "#smallbusiness", "#marketingtips", "#socialmedia", "#growth"]
    : ["#india", "#business", "#marketing"];

  const selected = [...unique, ...defaults].slice(0, desired);
  const hashtagLine = selected.join(" ");

  return {
    text: `${body}\n\n${hashtagLine}`.trim(),
    changed: true,
  };
}

function addIndiaContext(text: string): { text: string; changed: boolean } {
  if (/(india|indian|inr|rs\b|rupee|whatsapp|delhi|mumbai|bengaluru|hyderabad|pune|chennai|kolkata|diwali|holi)/i.test(text)) {
    return { text, changed: false };
  }

  const line = "Built for Indian audiences and local buying behavior.";
  return { text: `${text}\n\n${line}`.trim(), changed: true };
}

function fitLength(text: string, channel: ScoreChannel): { text: string; changed: boolean } {
  const max = channel === "instagram" ? 650 : channel === "facebook" ? 500 : 900;
  if (text.length <= max) {
    return { text, changed: false };
  }

  const trimmed = `${text.slice(0, max - 3).trim()}...`;
  return { text: trimmed, changed: true };
}

export async function improveCaption(input: {
  caption: string;
  channel: ScoreChannel;
  imageUrl?: string;
  scheduledAt?: string;
}): Promise<ContentFixResult> {
  let working = normalizeSpaces(input.caption);
  const applied: string[] = [];

  const before = await scoreContent({
    caption: working,
    channel: input.channel,
    imageUrl: input.imageUrl,
    scheduledAt: input.scheduledAt,
  });

  const hook = ensureHook(working);
  if (hook.changed) {
    working = hook.text;
    applied.push("Improved first line hook for stronger scroll-stop.");
  }

  const cta = ensureCta(working);
  if (cta.changed) {
    working = cta.text;
    applied.push("Added a clear CTA so audience knows what to do next.");
  }

  const india = addIndiaContext(working);
  if (india.changed) {
    working = india.text;
    applied.push("Added India-market context for better local relevance.");
  }

  const tags = fixHashtags(working, input.channel);
  if (tags.changed) {
    working = tags.text;
    applied.push("Optimized hashtag count and relevance for selected channel.");
  }

  const length = fitLength(working, input.channel);
  if (length.changed) {
    working = length.text;
    applied.push("Adjusted caption length to match channel best-practice range.");
  }

  const after = await scoreContent({
    caption: working,
    channel: input.channel,
    imageUrl: input.imageUrl,
    scheduledAt: input.scheduledAt,
  });

  return {
    improvedCaption: working,
    appliedFixes: applied.length > 0 ? applied : ["No major issues found. Caption is already well-optimized."],
    beforeScore: before.score,
    afterScore: after.score,
  };
}
