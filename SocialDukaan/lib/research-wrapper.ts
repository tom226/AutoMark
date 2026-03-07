import type { Channel } from "@/lib/types";
import type { ResearchItem, TrendingHashtag } from "@/lib/research-store";

interface CompetitorInput {
  handle: string;
  channel: Channel;
}

const platformTrendSources: Record<string, string[]> = {
  instagram: [
    "https://www.instagram.com/explore/tags/marketing/",
    "https://www.instagram.com/explore/tags/socialmedia/",
  ],
  facebook: [
    "https://www.instagram.com/explore/tags/facebookmarketing/",
    "https://www.linkedin.com/feed/hashtag/socialmedia/",
  ],
  linkedin: [
    "https://www.linkedin.com/feed/hashtag/marketing/",
    "https://www.linkedin.com/feed/hashtag/socialmedia/",
  ],
  twitter: [
    "https://www.instagram.com/explore/tags/twittermarketing/",
    "https://www.linkedin.com/feed/hashtag/digitalmarketing/",
  ],
  tiktok: [
    "https://www.instagram.com/explore/tags/tiktokmarketing/",
    "https://www.linkedin.com/feed/hashtag/shortvideo/",
  ],
  youtube: [
    "https://www.instagram.com/explore/tags/youtubemarketing/",
    "https://www.linkedin.com/feed/hashtag/videomarketing/",
  ],
};

const categoryTrendSources: Record<string, string[]> = {
  sports: ["https://www.instagram.com/explore/tags/sports/", "https://www.linkedin.com/feed/hashtag/sportsbusiness/"],
  movies: ["https://www.instagram.com/explore/tags/movies/", "https://www.linkedin.com/feed/hashtag/entertainment/"],
  gaming: ["https://www.instagram.com/explore/tags/gaming/", "https://www.linkedin.com/feed/hashtag/gamingindustry/"],
  business: ["https://www.instagram.com/explore/tags/business/", "https://www.linkedin.com/feed/hashtag/business/"],
  marketing: ["https://www.instagram.com/explore/tags/marketing/", "https://www.linkedin.com/feed/hashtag/marketing/"],
  technology: ["https://www.instagram.com/explore/tags/technology/", "https://www.linkedin.com/feed/hashtag/technology/"],
  fashion: ["https://www.instagram.com/explore/tags/fashion/", "https://www.linkedin.com/feed/hashtag/fashion/"],
  health: ["https://www.instagram.com/explore/tags/health/", "https://www.linkedin.com/feed/hashtag/healthcare/"],
  travel: ["https://www.instagram.com/explore/tags/travel/", "https://www.linkedin.com/feed/hashtag/travel/"],
  food: ["https://www.instagram.com/explore/tags/food/", "https://www.linkedin.com/feed/hashtag/foodindustry/"],
};

interface WrappedFetchResult {
  sourceUrl: string;
  title: string;
  snippet: string;
  hashtags: string[];
}

export interface ResearchFetchDiagnostics {
  attemptedSources: number;
  acceptedSources: number;
  rejectedSources: number;
  rejectionReasons: Record<string, number>;
}

type RejectionReason =
  | "timeout_or_network"
  | "http_not_ok"
  | "content_too_short"
  | "login_wall_or_blocked"
  | "low_relevance";

interface WrappedFetchAttempt {
  result: WrappedFetchResult | null;
  reason?: RejectionReason;
}

type ResearchKind = "competitor" | "trend";

interface QualityContext {
  kind: ResearchKind;
  sourceUrl: string;
  competitorHandle?: string;
  requiredKeywords?: string[];
}

const WRAPPER_PREFIX = "https://r.jina.ai/http://";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Request timeout")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function normalizeHandle(handle: string): string {
  return handle.replace(/^@+/, "").trim().toLowerCase();
}

function buildCompetitorUrl(input: CompetitorInput): string {
  const clean = normalizeHandle(input.handle);
  if (input.channel === "instagram") return `https://www.instagram.com/${clean}/`;
  if (input.channel === "facebook") return `https://www.facebook.com/${clean}`;
  if (input.channel === "linkedin") return `https://www.linkedin.com/company/${clean}`;
  return `https://x.com/${clean}`;
}

function toWrappedUrl(url: string): string {
  return `${WRAPPER_PREFIX}${url.replace(/^https?:\/\//, "")}`;
}

function isInstagramOrLinkedInSource(url: string): boolean {
  return /instagram\.com|linkedin\.com/i.test(url);
}

function normalizePlainText(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

function stripWrapperBoilerplate(text: string): string {
  const removedHeaders = text
    .replace(/\bURL Source:\s*https?:\/\/[^\s]+/gi, " ")
    .replace(/\bMarkdown Content:\s*/gi, " ")
    .replace(/\bTitle:\s*/gi, " ")
    .replace(/={3,}/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ");

  return normalizePlainText(removedHeaders);
}

function isLikelyLoginWall(text: string, sourceUrl: string): boolean {
  const haystack = `${text} ${sourceUrl}`.toLowerCase();
  const loginPatterns = [
    "log into instagram",
    "login to instagram",
    "see everyday moments from your close friends",
    "instagram login",
    "linkedin login",
    "sign in with apple",
    "sign in with google",
    "forgot password",
    "create account",
    "by clicking continue",
    "terms of service",
  ];

  return loginPatterns.some((pattern) => haystack.includes(pattern));
}

function toKeywordTokens(values: string[]): string[] {
  return [...new Set(
    values
      .map((value) => value.toLowerCase().replace(/[^a-z0-9#\s]/g, " "))
      .flatMap((value) => value.split(/\s+/))
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
  )];
}

function computeKeywordMatches(text: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const haystack = text.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += 1;
  }
  return score;
}

function passesQualityGate(input: {
  rawText: string;
  snippet: string;
  hashtags: string[];
  context: QualityContext;
}): { ok: boolean; reason?: RejectionReason } {
  const text = normalizePlainText(`${input.rawText} ${input.context.sourceUrl}`);
  if (text.length < 120) {
    return { ok: false, reason: "content_too_short" };
  }
  if (isLikelyLoginWall(text, input.context.sourceUrl)) {
    return { ok: false, reason: "login_wall_or_blocked" };
  }

  const keywordScore = computeKeywordMatches(text, input.context.requiredKeywords ?? []);
  const hashtagScore = input.hashtags.length > 0 ? 1 : 0;
  const summaryLengthScore = input.snippet.length >= 100 ? 1 : 0;
  const totalScore = keywordScore + hashtagScore + summaryLengthScore;

  if (input.context.kind === "competitor") {
    return totalScore >= 2
      ? { ok: true }
      : { ok: false, reason: "low_relevance" };
  }

  return totalScore >= 3
    ? { ok: true }
    : { ok: false, reason: "low_relevance" };
}

function extractTitle(text: string): string {
  const clean = stripWrapperBoilerplate(text);
  const lines = clean
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 5);

  return lines[0]?.slice(0, 120) || "Fetched competitor update";
}

function extractSnippet(text: string): string {
  const cleaned = stripWrapperBoilerplate(text);
  return cleaned.slice(0, 280);
}

function extractHashtags(text: string): string[] {
  const tags = text.match(/#[a-z0-9_]{2,40}/gi) ?? [];
  const unique = new Set<string>();

  for (const tag of tags) {
    unique.add(tag.toLowerCase());
    if (unique.size >= 12) break;
  }

  return [...unique];
}

async function fetchWrappedContent(url: string, context: QualityContext): Promise<WrappedFetchAttempt> {
  const wrappedUrl = toWrappedUrl(url);

  try {
    const response = await withTimeout(
      fetch(wrappedUrl, {
        cache: "no-store",
        headers: {
          "User-Agent": "SocialDukaanResearchBot/1.0",
        },
      }),
      18_000
    );

    if (!response.ok) return { result: null, reason: "http_not_ok" };

    const text = await response.text();
    const snippet = extractSnippet(text);
    if (!snippet || snippet.length < 30) {
      return { result: null, reason: "content_too_short" };
    }

    const hashtags = extractHashtags(text);
    const quality = passesQualityGate({ rawText: text, snippet, hashtags, context });
    if (!quality.ok) {
      return { result: null, reason: quality.reason ?? "low_relevance" };
    }

    return {
      result: {
        sourceUrl: url,
        title: extractTitle(text),
        snippet,
        hashtags,
      },
    };
  } catch {
    return { result: null, reason: "timeout_or_network" };
  }
}

function getTrendUrls(input: { platforms?: string[]; categories?: string[] }): string[] {
  const urls = new Set<string>([
    "https://www.instagram.com/explore/tags/socialmedia/",
    "https://www.linkedin.com/feed/hashtag/socialmedia/",
  ]);

  for (const platform of input.platforms ?? []) {
    for (const url of platformTrendSources[platform.toLowerCase()] ?? []) {
      urls.add(url);
    }
  }

  for (const category of input.categories ?? []) {
    for (const url of categoryTrendSources[category.toLowerCase()] ?? []) {
      urls.add(url);
    }
  }

  return [...urls].slice(0, 12);
}

function getWeightedTrendUrls(input: {
  platforms?: string[];
  categories?: string[];
  categoryWeights?: Record<string, number>;
}): string[] {
  const baseUrls = new Set(getTrendUrls({ platforms: input.platforms, categories: input.categories }));
  const weightedCategories = [...(input.categories ?? [])].sort((a, b) => {
    const wb = Number(input.categoryWeights?.[b] ?? 1);
    const wa = Number(input.categoryWeights?.[a] ?? 1);
    return wb - wa;
  });

  for (const category of weightedCategories) {
    const weight = Math.max(1, Math.min(5, Number(input.categoryWeights?.[category] ?? 1)));
    const slug = category.toLowerCase().replace(/\s+/g, "");

    baseUrls.add(`https://www.instagram.com/explore/tags/${slug}/`);
    baseUrls.add(`https://www.linkedin.com/feed/hashtag/${slug}/`);
    if (weight >= 3) {
      baseUrls.add(`https://www.instagram.com/explore/tags/${slug}trends/`);
      baseUrls.add(`https://www.linkedin.com/feed/hashtag/${slug}marketing/`);
    }
    if (weight >= 5) {
      baseUrls.add(`https://www.instagram.com/explore/tags/${slug}tips/`);
      baseUrls.add(`https://www.linkedin.com/feed/hashtag/${slug}insights/`);
    }
  }

  return [...baseUrls].slice(0, 18);
}

async function fetchTrendingSources(input: {
  platforms?: string[];
  categories?: string[];
  categoryWeights?: Record<string, number>;
  customHashtags?: string[];
}): Promise<{ results: WrappedFetchResult[]; diagnostics: ResearchFetchDiagnostics }> {
  const trendUrls = getWeightedTrendUrls(input);
  const baseKeywords = toKeywordTokens([
    ...(input.platforms ?? []),
    ...(input.categories ?? []),
    ...((input.customHashtags ?? []).map((tag) => tag.replace(/^#/, ""))),
    "trend",
    "social",
    "content",
  ]);

  const attempts = await Promise.all(
    trendUrls.map((url) =>
      fetchWrappedContent(url, {
        kind: "trend",
        sourceUrl: url,
        requiredKeywords: baseKeywords,
      })
    )
  );

  const rejectionReasons: Record<string, number> = {};
  for (const item of attempts) {
    if (item.result || !item.reason) continue;
    rejectionReasons[item.reason] = (rejectionReasons[item.reason] ?? 0) + 1;
  }

  const results = attempts
    .map((item) => item.result)
    .filter((item): item is WrappedFetchResult => Boolean(item));

  return {
    results,
    diagnostics: {
      attemptedSources: trendUrls.length,
      acceptedSources: results.length,
      rejectedSources: Math.max(0, trendUrls.length - results.length),
      rejectionReasons,
    },
  };
}

function buildTrendingHashtags(items: ResearchItem[]): TrendingHashtag[] {
  const tagMap = new Map<string, { count: number; sources: Set<string> }>();

  for (const item of items) {
    if (!isInstagramOrLinkedInSource(item.sourceUrl)) continue;
    for (const tag of item.hashtags) {
      const curr = tagMap.get(tag) ?? { count: 0, sources: new Set<string>() };
      curr.count += 1;
      curr.sources.add(item.sourceUrl);
      tagMap.set(tag, curr);
    }
  }

  return [...tagMap.entries()]
    .map(([tag, value]) => ({
      tag,
      count: value.count,
      sources: [...value.sources].slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

export async function fetchResearchUsingWrapper(input: {
  competitors: CompetitorInput[];
  platforms?: string[];
  categories?: string[];
  categoryWeights?: Record<string, number>;
  customHashtags?: string[];
}): Promise<{ items: ResearchItem[]; trendingHashtags: TrendingHashtag[]; diagnostics: ResearchFetchDiagnostics }> {
  const now = new Date().toISOString();
  const userCompetitors = input.competitors.filter((item) => item.handle && item.handle.trim().length > 0);

  const competitorAttempts = await Promise.all(
    userCompetitors.map(async (competitor, index) => {
      const sourceUrl = buildCompetitorUrl(competitor);
      const handleTokens = toKeywordTokens([
        normalizeHandle(competitor.handle),
        competitor.channel,
        ...(input.categories ?? []),
        ...(input.platforms ?? []),
      ]);

      const wrapped = await fetchWrappedContent(sourceUrl, {
        kind: "competitor",
        sourceUrl,
        competitorHandle: competitor.handle,
        requiredKeywords: handleTokens,
      });
      if (!wrapped.result) return { item: null, reason: wrapped.reason };

      return {
        reason: undefined,
        item: {
        id: `research-${Date.now()}-${index}`,
        competitorHandle: competitor.handle.startsWith("@") ? competitor.handle : `@${competitor.handle}`,
        channel: competitor.channel,
        sourceUrl: wrapped.result.sourceUrl,
        title: wrapped.result.title,
        snippet: wrapped.result.snippet,
        hashtags: wrapped.result.hashtags,
        fetchedAt: now,
      } as ResearchItem,
      };
    })
  );

  const trendBatch = await fetchTrendingSources({
    platforms: input.platforms,
    categories: input.categories,
    categoryWeights: input.categoryWeights,
    customHashtags: input.customHashtags,
  });
  const trendItems: ResearchItem[] = trendBatch.results.map((item, index) => ({
    id: `research-trend-${Date.now()}-${index}`,
    competitorHandle: "@trending",
    channel: item.sourceUrl.includes("linkedin.com") ? "linkedin" : "instagram",
    sourceUrl: item.sourceUrl,
    title: item.title,
    snippet: item.snippet,
    hashtags: [...new Set([...(item.hashtags ?? []), ...((input.customHashtags ?? []).map((tag) => tag.startsWith("#") ? tag.toLowerCase() : `#${tag.toLowerCase()}`))])],
    fetchedAt: now,
  }));

  const competitorRejections: Record<string, number> = {};
  const acceptedCompetitorItems = competitorAttempts
    .map((attempt) => {
      if (attempt.reason) {
        competitorRejections[attempt.reason] = (competitorRejections[attempt.reason] ?? 0) + 1;
      }
      return attempt.item;
    })
    .filter((item): item is ResearchItem => Boolean(item));

  const items = [...acceptedCompetitorItems, ...trendItems];
  const trendingHashtags = buildTrendingHashtags(items);

  const mergedReasons: Record<string, number> = { ...competitorRejections };
  for (const [reason, count] of Object.entries(trendBatch.diagnostics.rejectionReasons)) {
    mergedReasons[reason] = (mergedReasons[reason] ?? 0) + count;
  }

  const diagnostics: ResearchFetchDiagnostics = {
    attemptedSources: userCompetitors.length + trendBatch.diagnostics.attemptedSources,
    acceptedSources: acceptedCompetitorItems.length + trendBatch.diagnostics.acceptedSources,
    rejectedSources:
      userCompetitors.length - acceptedCompetitorItems.length + trendBatch.diagnostics.rejectedSources,
    rejectionReasons: mergedReasons,
  };

  return { items, trendingHashtags, diagnostics };
}
