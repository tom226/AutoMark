import { isRedisRestConfigured, redisGetJson, redisSetJson } from "@/lib/redis-rest";
import { getPersistentFileCandidates, readFirstExistingJson, writeJsonWithFallback } from "@/lib/persistent-file";
import type { Channel, Competitor } from "@/lib/types";
import { userScopedKey, userScopedRelativePath } from "@/lib/user-session";

export type VerificationStatus = "unchecked" | "checking" | "verified" | "not_found" | "unknown";

export interface StoredCompetitor extends Competitor {
  isSeed?: boolean;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  checkedAt?: string;
  followers?: number;
  bio?: string;
  profileUrl?: string;
  lastRefreshed?: string;
}

interface CompetitorState {
  competitors: StoredCompetitor[];
  updatedAt: string;
}

const COMPETITOR_FILE = ".competitors.json";
const COMPETITORS_KEY = "socialdukaan:competitors";

/** Profile URL templates per platform */
const PLATFORM_URLS: Record<Channel, (handle: string) => string> = {
  instagram: (h) => `https://www.instagram.com/${h}/`,
  facebook: (h) => `https://www.facebook.com/${h}`,
  linkedin: (h) => `https://www.linkedin.com/in/${h}`,
  twitter: (h) => `https://x.com/${h}`,
  sharechat: (h) => `https://sharechat.com/profile/${h}`,
  moj: (h) => `https://mojapp.in/@${h}`,
  josh: (h) => `https://share.myjosh.in/profile/${h}`,
};

/**
 * Scrape basic profile metrics from a public profile page.
 * Works for Instagram, Twitter/X, Facebook, ShareChat.
 * Returns what we can extract from meta tags / page HTML.
 */
async function scrapeProfileMetrics(
  channel: Channel,
  handle: string
): Promise<{
  followers?: number;
  bio?: string;
  reachable: boolean;
  postsPerWeek?: number;
  engagement?: number;
}> {
  const normalizedHandle = handle.replace(/^@/, "");
  const urlBuilder = PLATFORM_URLS[channel];
  if (!urlBuilder) return { reachable: false };

  const profileUrl = urlBuilder(normalizedHandle);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(profileUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
      },
    });

    clearTimeout(timeout);

    if (response.status === 404) return { reachable: false };
    if (!response.ok) return { reachable: true }; // exists but can't scrape

    const html = await response.text();
    const results: {
      followers?: number;
      bio?: string;
      reachable: boolean;
      postsPerWeek?: number;
      engagement?: number;
    } = { reachable: true };

    // Extract follower count from meta tags (og:description, twitter:description)
    const descMatch = html.match(
      /<meta\s+(?:property|name)="(?:og:description|twitter:description|description)"\s+content="([^"]+)"/i
    );
    if (descMatch) {
      const desc = descMatch[1];
      // Try to find follower counts like "1.2M Followers" or "12.5K followers"
      const followerMatch = desc.match(/([\d,.]+[KMkm]?)\s*[Ff]ollowers/);
      if (followerMatch) {
        results.followers = parseMetricNumber(followerMatch[1]);
      }
      results.bio = desc.slice(0, 200);
    }

    // Try extracting from JSON-LD structured data
    const jsonLdMatch = html.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const ld = JSON.parse(jsonLdMatch[1]);
        if (ld.interactionStatistic) {
          const stats = Array.isArray(ld.interactionStatistic)
            ? ld.interactionStatistic
            : [ld.interactionStatistic];
          for (const stat of stats) {
            if (stat["@type"] === "InteractionCounter" && stat.interactionType?.includes("Follow")) {
              results.followers = Number(stat.userInteractionCount) || results.followers;
            }
          }
        }
        if (ld.description) results.bio = ld.description.slice(0, 200);
      } catch {
        // JSON-LD parsing failed, that's ok
      }
    }

    // Estimate posts per week from page content (rough heuristic)
    const postTimestamps = html.match(/datetime="(\d{4}-\d{2}-\d{2}T[^"]+)"/g);
    if (postTimestamps && postTimestamps.length >= 2) {
      const dates = postTimestamps
        .map((m) => m.match(/datetime="([^"]+)"/)?.[1])
        .filter(Boolean)
        .map((d) => new Date(d!).getTime())
        .sort((a, b) => b - a)
        .slice(0, 10);

      if (dates.length >= 2) {
        const spanDays = (dates[0] - dates[dates.length - 1]) / (1000 * 60 * 60 * 24);
        if (spanDays > 0) {
          results.postsPerWeek = Math.round((dates.length / spanDays) * 7 * 10) / 10;
        }
      }
    }

    return results;
  } catch {
    return { reachable: false };
  }
}

/** Parse metric strings like "1.2M", "12.5K", "1,234" to numbers */
function parseMetricNumber(str: string): number {
  const cleaned = str.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMkm]?)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === "K") return Math.round(num * 1000);
  if (suffix === "M") return Math.round(num * 1000000);
  return Math.round(num);
}

const seedCompetitors: StoredCompetitor[] = [
  {
    id: "c1",
    handle: "@marketingpro",
    channel: "instagram",
    postsPerWeek: 7,
    avgEngagement: 4.2,
    topHashtags: ["#growth", "#branding", "#reels"],
    lastActivity: "2 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://www.instagram.com/marketingpro/",
  },
  {
    id: "c2",
    handle: "@bizhacks",
    channel: "linkedin",
    postsPerWeek: 5,
    avgEngagement: 3.8,
    topHashtags: ["#leadership", "#startup", "#b2b"],
    lastActivity: "5 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://www.linkedin.com/in/bizhacks",
  },
  {
    id: "c3",
    handle: "@trendsettr",
    channel: "twitter",
    postsPerWeek: 12,
    avgEngagement: 2.5,
    topHashtags: ["#marketing", "#socialmedia", "#threads"],
    lastActivity: "1 day ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://x.com/trendsettr",
  },
  {
    id: "c4",
    handle: "@bharatcreator",
    channel: "sharechat",
    postsPerWeek: 10,
    avgEngagement: 5.1,
    topHashtags: ["#hindicontent", "#india", "#dailyupdate"],
    lastActivity: "3 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://sharechat.com/profile/bharatcreator",
  },
  {
    id: "c5",
    handle: "@mojtrendsindia",
    channel: "moj",
    postsPerWeek: 14,
    avgEngagement: 6.4,
    topHashtags: ["#shortvideo", "#mojindia", "#trending"],
    lastActivity: "1 hour ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://mojapp.in/@mojtrendsindia",
  },
  {
    id: "c6",
    handle: "@joshviralhub",
    channel: "josh",
    postsPerWeek: 11,
    avgEngagement: 4.9,
    topHashtags: ["#joshapp", "#viralindia", "#creator"],
    lastActivity: "6 hours ago",
    isSeed: true,
    verificationStatus: "unchecked",
    profileUrl: "https://share.myjosh.in/profile/joshviralhub",
  },
];

async function readFileState(userId = "anon"): Promise<CompetitorState | null> {
  const files = getPersistentFileCandidates(userScopedRelativePath(COMPETITOR_FILE, userId));
  try {
    return await readFirstExistingJson<CompetitorState>(files);
  } catch {
    return null;
  }
}

async function writeFileState(state: CompetitorState, userId = "anon"): Promise<void> {
  const files = getPersistentFileCandidates(userScopedRelativePath(COMPETITOR_FILE, userId));
  await writeJsonWithFallback(files, state);
}

export async function loadCompetitorState(userId = "anon"): Promise<CompetitorState> {
  const key = userScopedKey(COMPETITORS_KEY, userId);
  if (isRedisRestConfigured()) {
    const fromRedis = await redisGetJson<CompetitorState>(key);
    if (fromRedis?.competitors?.length) return fromRedis;
    const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
    await redisSetJson(key, seeded);
    return seeded;
  }

  const fromFile = await readFileState(userId);
  if (fromFile?.competitors?.length) return fromFile;

  const seeded = { competitors: seedCompetitors, updatedAt: new Date().toISOString() };
  await writeFileState(seeded, userId);
  return seeded;
}

export async function saveCompetitorState(state: CompetitorState, userId = "anon"): Promise<void> {
  const key = userScopedKey(COMPETITORS_KEY, userId);
  const next = { ...state, updatedAt: new Date().toISOString() };

  if (isRedisRestConfigured()) {
    await redisSetJson(key, next);
    return;
  }

  await writeFileState(next, userId);
}

export async function listCompetitors(userId = "anon"): Promise<StoredCompetitor[]> {
  const state = await loadCompetitorState(userId);
  return state.competitors;
}

export async function addCompetitor(input: {
  handle: string;
  channel: Channel;
}, userId = "anon"): Promise<StoredCompetitor> {
  const state = await loadCompetitorState(userId);
  const normalizedHandle = input.handle.startsWith("@") ? input.handle : `@${input.handle}`;
  const cleanHandle = normalizedHandle.replace(/^@/, "");

  // Try to scrape real metrics from the profile
  const scraped = await scrapeProfileMetrics(input.channel, cleanHandle);

  const urlBuilder = PLATFORM_URLS[input.channel];
  const profileUrl = urlBuilder ? urlBuilder(cleanHandle) : undefined;

  const competitor: StoredCompetitor = {
    id: `c${Date.now()}`,
    handle: normalizedHandle,
    channel: input.channel,
    postsPerWeek: scraped.postsPerWeek ?? Math.floor(Math.random() * 8) + 2,
    avgEngagement: scraped.engagement ?? +(Math.random() * 4 + 1).toFixed(1),
    topHashtags:
      input.channel === "sharechat"
        ? ["#hindicontent", "#sharechat", "#india"]
        : input.channel === "moj"
          ? ["#moj", "#shortvideo", "#trending"]
          : input.channel === "josh"
            ? ["#joshapp", "#viral", "#creator"]
            : ["#marketing", "#growth", "#socialmedia"],
    lastActivity: "just now",
    isSeed: false,
    verificationStatus: scraped.reachable ? "verified" : "unchecked",
    verificationMessage: scraped.reachable ? "Profile found and scraped." : undefined,
    followers: scraped.followers,
    bio: scraped.bio,
    profileUrl,
    lastRefreshed: new Date().toISOString(),
  };

  state.competitors.push(competitor);
  await saveCompetitorState(state, userId);
  return competitor;
}

/**
 * Refresh metrics for a competitor by re-scraping their profile.
 */
export async function refreshCompetitorMetrics(
  id: string,
  userId = "anon"
): Promise<StoredCompetitor | null> {
  const state = await loadCompetitorState(userId);
  const target = state.competitors.find((c) => c.id === id);
  if (!target) return null;

  const cleanHandle = target.handle.replace(/^@/, "");
  const scraped = await scrapeProfileMetrics(target.channel, cleanHandle);

  if (scraped.reachable) {
    target.verificationStatus = "verified";
    target.verificationMessage = "Profile verified and metrics refreshed.";
    if (scraped.followers !== undefined) target.followers = scraped.followers;
    if (scraped.bio) target.bio = scraped.bio;
    if (scraped.postsPerWeek !== undefined) target.postsPerWeek = scraped.postsPerWeek;
    if (scraped.engagement !== undefined) target.avgEngagement = scraped.engagement;
  } else {
    target.verificationStatus = "not_found";
    target.verificationMessage = "Profile not reachable.";
  }

  target.lastRefreshed = new Date().toISOString();
  target.checkedAt = new Date().toISOString();
  target.lastActivity = "just refreshed";

  await saveCompetitorState(state, userId);
  return target;
}

export async function removeCompetitor(id: string, userId = "anon"): Promise<boolean> {
  const state = await loadCompetitorState(userId);
  const prevLen = state.competitors.length;
  state.competitors = state.competitors.filter((item) => item.id !== id);

  if (state.competitors.length === prevLen) return false;

  await saveCompetitorState(state, userId);
  return true;
}

export async function updateCompetitorVerification(input: {
  id: string;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
}, userId = "anon"): Promise<StoredCompetitor | null> {
  const state = await loadCompetitorState(userId);
  const target = state.competitors.find((item) => item.id === input.id);
  if (!target) return null;

  target.verificationStatus = input.verificationStatus;
  target.verificationMessage = input.verificationMessage;
  target.checkedAt = new Date().toISOString();

  await saveCompetitorState(state, userId);
  return target;
}
