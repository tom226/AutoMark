type SupportedImageChannel = "instagram" | "facebook";

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(input: string, maxWords = 4): string[] {
  const cleaned = normalizeToken(input);
  if (!cleaned) return [];

  return cleaned
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, maxWords);
}

function toQueryTerms(input: {
  topic?: string;
  competitorHint?: string;
  caption?: string;
  channel: SupportedImageChannel;
}): string[] {
  const terms = new Set<string>();

  for (const word of extractKeywords(input.topic ?? "", 5)) terms.add(word);
  for (const word of extractKeywords(input.competitorHint ?? "", 3)) terms.add(word);
  for (const word of extractKeywords(input.caption ?? "", 4)) terms.add(word);

  if (terms.size === 0) {
    terms.add("social");
    terms.add("marketing");
    terms.add("content");
  }

  terms.add(input.channel === "instagram" ? "portrait" : "brand");

  return Array.from(terms).slice(0, 8);
}

export function buildAutoImageUrl(input: {
  topic?: string;
  competitorHint?: string;
  caption?: string;
  channel: SupportedImageChannel;
  seed?: string;
}): string {
  const terms = toQueryTerms(input);
  const primary = terms.slice(0, 4).join(" ") || "social content";
  const secondary = terms.slice(4, 7).join(" ");
  const label = `${primary}${secondary ? ` | ${secondary}` : ""}`.slice(0, 80);

  // Meta-friendly direct image URL (PNG) with contextual text.
  return `https://placehold.co/1600x900/png?text=${encodeURIComponent(label)}`;
}

function isLikelyMetaIncompatibleImageUrl(url: string): boolean {
  const lowered = url.toLowerCase();
  return (
    lowered.includes("source.unsplash.com") ||
    lowered.includes("images.unsplash.com/source")
  );
}

export function resolveAutopilotImageUrl(input: {
  preferredUrl?: string;
  topic?: string;
  competitorHint?: string;
  caption?: string;
  channel: SupportedImageChannel;
  seed?: string;
}): string {
  const preferred = input.preferredUrl?.trim();
  if (!preferred || isLikelyMetaIncompatibleImageUrl(preferred)) {
    return buildAutoImageUrl({
      topic: input.topic,
      competitorHint: input.competitorHint,
      caption: input.caption,
      channel: input.channel,
      seed: input.seed,
    });
  }

  try {
    const parsed = new URL(preferred);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return preferred;
    }
  } catch {
    // fall through to generated image
  }

  return buildAutoImageUrl({
    topic: input.topic,
    competitorHint: input.competitorHint,
    caption: input.caption,
    channel: input.channel,
    seed: input.seed,
  });
}
