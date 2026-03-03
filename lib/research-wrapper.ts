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

function extractTitle(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 5);

  return lines[0]?.slice(0, 120) || "Fetched competitor update";
}

function extractSnippet(text: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
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

async function fetchWrappedContent(url: string): Promise<WrappedFetchResult | null> {
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

    if (!response.ok) return null;

    const text = await response.text();
    const snippet = extractSnippet(text);
    if (!snippet || snippet.length < 30) return null;

    return {
      sourceUrl: url,
      title: extractTitle(text),
      snippet,
      hashtags: extractHashtags(text),
    };
  } catch {
    return null;
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
}): Promise<WrappedFetchResult[]> {
  const trendUrls = getWeightedTrendUrls(input);

  const results = await Promise.all(trendUrls.map((url) => fetchWrappedContent(url)));
  return results.filter((item): item is WrappedFetchResult => Boolean(item));
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
}): Promise<{ items: ResearchItem[]; trendingHashtags: TrendingHashtag[] }> {
  const now = new Date().toISOString();
  const userCompetitors = input.competitors.filter((item) => item.handle && item.handle.trim().length > 0);

  const competitorResults = await Promise.all(
    userCompetitors.map(async (competitor, index) => {
      const sourceUrl = buildCompetitorUrl(competitor);
      const wrapped = await fetchWrappedContent(sourceUrl);
      if (!wrapped) return null;

      return {
        id: `research-${Date.now()}-${index}`,
        competitorHandle: competitor.handle.startsWith("@") ? competitor.handle : `@${competitor.handle}`,
        channel: competitor.channel,
        sourceUrl: wrapped.sourceUrl,
        title: wrapped.title,
        snippet: wrapped.snippet,
        hashtags: wrapped.hashtags,
        fetchedAt: now,
      } as ResearchItem;
    })
  );

  const trendResults = await fetchTrendingSources({
    platforms: input.platforms,
    categories: input.categories,
    categoryWeights: input.categoryWeights,
  });
  const trendItems: ResearchItem[] = trendResults.map((item, index) => ({
    id: `research-trend-${Date.now()}-${index}`,
    competitorHandle: "@trending",
    channel: item.sourceUrl.includes("linkedin.com") ? "linkedin" : "instagram",
    sourceUrl: item.sourceUrl,
    title: item.title,
    snippet: item.snippet,
    hashtags: [...new Set([...(item.hashtags ?? []), ...((input.customHashtags ?? []).map((tag) => tag.startsWith("#") ? tag.toLowerCase() : `#${tag.toLowerCase()}`))])],
    fetchedAt: now,
  }));

  const items = [...competitorResults.filter((item): item is ResearchItem => Boolean(item)), ...trendItems];
  const trendingHashtags = buildTrendingHashtags(items);

  return { items, trendingHashtags };
}
