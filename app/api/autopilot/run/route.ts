import { NextResponse } from "next/server";
import { loadTokens } from "@/lib/token-store";
import { resolveAutopilotImageUrl } from "@/lib/autopilot-image";
import { listCompetitors } from "@/lib/competitor-store";
import { upsertWeeklyTasks, type WeeklyContentTask } from "@/lib/task-folder-store";
import { getPageProfile, getRecentPagePosts } from "@/lib/meta";
import { researchTopicInsights } from "@/lib/topic-research";
import { fetchResearchUsingWrapper } from "@/lib/research-wrapper";
import { getResearchSnapshot, replaceResearchSnapshot } from "@/lib/research-store";
import { getResearchPreferences } from "@/lib/research-preferences-store";

interface AutopilotPayload {
  channels: ("instagram" | "facebook")[];
  pageId: string;
  imageUrl?: string;
  tone?: string;
  competitorHint?: string;
  campaignTopic?: string;
}

interface QueueInsight {
  title: string;
  summary: string;
  sourceUrl: string;
}

function toAccountHandle(pageName: string): string {
  return `@${pageName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "account"}`;
}

function extractTopicWords(topic: string): string[] {
  return topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 8);
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "and", "for", "with", "this", "that", "your", "from", "have", "will", "into", "about", "after", "before", "their", "they", "just", "our", "you", "are", "has", "was", "were", "today",
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s#]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word) && !word.startsWith("http"));
}

function inferTopicFromAccount(input: {
  explicitTopic?: string;
  pageName: string;
  pageCategory?: string;
  pageDescription?: string;
  recentPostMessages: string[];
}): string {
  const explicit = input.explicitTopic?.trim();
  if (explicit) return explicit;

  const corpus = [
    input.pageName,
    input.pageCategory ?? "",
    input.pageDescription ?? "",
    ...input.recentPostMessages,
  ].join(" ");

  const tokens = extractKeywords(corpus);
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1);
  }

  const top = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([word]) => word);

  if (top.length >= 2) {
    return `${top.slice(0, 3).join(" ")} strategy`;
  }

  return `${input.pageName} content strategy`;
}

function detectPrimaryLocation(text: string): string | undefined {
  const lowered = text.toLowerCase();
  if (/(delhi|ncr|gurugram|noida)/.test(lowered)) return "Delhi NCR";
  if (/(mumbai)/.test(lowered)) return "Mumbai";
  if (/(bengaluru|bangalore)/.test(lowered)) return "Bengaluru";
  if (/(hyderabad)/.test(lowered)) return "Hyderabad";
  return undefined;
}

function deriveHashtags(input: {
  topic: string;
  competitorHashtags: string[];
  preferredHashtags?: string[];
}): string[] {
  const fromTopic = extractTopicWords(input.topic).map((word) => `#${word.replace(/[^a-z0-9]/g, "")}`);
  const merged = [...new Set([...(input.competitorHashtags ?? []), ...(input.preferredHashtags ?? []), ...fromTopic, "#contentstrategy", "#socialmedia"])]
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .filter((tag) => tag.length > 2)
    .slice(0, 8);

  return merged;
}

function buildStyleSignature(messages: string[]): {
  avgLength: number;
  usesEmoji: boolean;
  hasCta: boolean;
} {
  const nonEmpty = messages.filter((msg) => msg.trim().length > 0);
  const avgLength =
    nonEmpty.length === 0
      ? 180
      : Math.round(nonEmpty.reduce((sum, msg) => sum + msg.length, 0) / nonEmpty.length);
  const usesEmoji = nonEmpty.some((msg) => /[\u{1F300}-\u{1FAFF}]/u.test(msg));
  const hasCta = nonEmpty.some((msg) => /(register|join|book|comment|dm|save|share|learn more|tap)/i.test(msg));
  return { avgLength, usesEmoji, hasCta };
}

function buildFallbackInsightsFromHistory(input: {
  topic: string;
  pageName: string;
  recentMessages: string[];
}): QueueInsight[] {
  const fromHistory = input.recentMessages
    .map((message, index) => {
      const clean = message.replace(/\s+/g, " ").trim();
      if (!clean) return null;
      return {
        title: `${input.topic} — Content Angle ${index + 1}`,
        summary: clean.slice(0, 180),
        sourceUrl: "",
      } as QueueInsight;
    })
    .filter((item): item is QueueInsight => Boolean(item))
    .slice(0, 5);

  const generic: QueueInsight[] = [
    {
      title: `${input.topic} — Beginner Guide`,
      summary: `A clear beginner-friendly breakdown tailored for ${input.pageName} audience with one practical action step.`,
      sourceUrl: "",
    },
    {
      title: `${input.topic} — Common Mistakes`,
      summary: `A concise list of common mistakes and how to avoid them, based on patterns seen in recent social posts.`,
      sourceUrl: "",
    },
    {
      title: `${input.topic} — Checklist`,
      summary: `A ready-to-use checklist format post that can drive saves, shares, and comments from your core audience.`,
      sourceUrl: "",
    },
    {
      title: `${input.topic} — Case Study Angle`,
      summary: `A short case-study narrative showing what worked, what failed, and what to do next for better outcomes.`,
      sourceUrl: "",
    },
    {
      title: `${input.topic} — Weekly Plan`,
      summary: `A weekly actionable plan with one CTA to convert viewers into active participants or leads.`,
      sourceUrl: "",
    },
  ];

  return [...fromHistory, ...generic];
}

function buildDistinctInsights(input: {
  researched: QueueInsight[];
  fallback: QueueInsight[];
  topic: string;
  requiredCount: number;
}): QueueInsight[] {
  const seen = new Set<string>();
  const merged = [...input.researched, ...input.fallback];
  const distinct: QueueInsight[] = [];

  for (const insight of merged) {
    const key = `${insight.title}`.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    distinct.push(insight);
    if (distinct.length >= input.requiredCount) return distinct;
  }

  const angleSeeds = [
    "Myth vs reality",
    "Step-by-step framework",
    "Do this, avoid that",
    "Quick audit checklist",
    "Case study breakdown",
    "Weekly execution plan",
    "Audience FAQ",
  ];

  let index = 0;
  while (distinct.length < input.requiredCount) {
    const angle = angleSeeds[index % angleSeeds.length];
    const title = `${input.topic} — ${angle}`;
    const key = title.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      distinct.push({
        title,
        summary: `A unique ${angle.toLowerCase()} angle tailored to this account's audience and recent content behavior.`,
        sourceUrl: "",
      });
    }
    index += 1;
  }

  return distinct;
}

function buildSyntheticFeedFromCompetitors(input: {
  competitors: Array<{ handle: string; topHashtags: string[] }>;
  topic: string;
}): Array<{
  id: string;
  handle: string;
  channel: string;
  caption: string;
  hashtags: string[];
  postedAt: string;
  postUrl: string;
}> {
  const now = Date.now();
  const items: Array<{
    id: string;
    handle: string;
    channel: string;
    caption: string;
    hashtags: string[];
    postedAt: string;
    postUrl: string;
  }> = [];

  for (let i = 0; i < input.competitors.length; i += 1) {
    const competitor = input.competitors[i];
    const tags = competitor.topHashtags?.slice(0, 3) ?? ["#socialmedia", "#growth"];
    items.push({
      id: `synthetic-${competitor.handle.replace(/[^a-z0-9]/gi, "")}-${i}`,
      handle: competitor.handle,
      channel: "instagram",
      caption: `Recent pattern from ${competitor.handle}: value-first posts around ${input.topic} with CTA-driven format.`,
      hashtags: tags,
      postedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
      postUrl: "",
    });
  }

  return items;
}

function rankFeedItems(input: {
  items: Array<{
    id: string;
    handle: string;
    channel: string;
    caption: string;
    hashtags: string[];
    postedAt: string;
    postUrl?: string;
  }>;
  competitorHint?: string;
  topic: string;
}): Array<{
  id: string;
  handle: string;
  channel: string;
  caption: string;
  hashtags: string[];
  postedAt: string;
  postUrl?: string;
}> {
  const topicWords = extractTopicWords(input.topic);
  const competitor = input.competitorHint?.toLowerCase();

  return [...input.items].sort((a, b) => {
    const score = (item: (typeof input.items)[number]) => {
      let points = 0;
      const haystack = `${item.caption} ${item.hashtags.join(" ")}`.toLowerCase();

      if (competitor && item.handle.toLowerCase().includes(competitor.replace("@", ""))) {
        points += 5;
      }

      for (const word of topicWords) {
        if (haystack.includes(word)) points += 2;
      }

      const ageHours = Math.max(
        1,
        (Date.now() - new Date(item.postedAt).getTime()) / (1000 * 60 * 60)
      );
      points += Math.max(0, 3 - Math.floor(ageHours / 48));

      return points;
    };

    return score(b) - score(a);
  });
}

function buildResearchedCaption(input: {
  topic: string;
  channel: "instagram" | "facebook";
  feedItem: {
    id: string;
    handle: string;
    channel: string;
    caption: string;
    hashtags: string[];
    postedAt: string;
    postUrl?: string;
  };
  insight: QueueInsight;
  style: { avgLength: number; usesEmoji: boolean; hasCta: boolean };
  tone?: string;
  preferredHashtags?: string[];
}): string {
  const sourceLine = input.feedItem.caption.replace(/\s+/g, " ").trim().slice(0, 120);
  const insightLine = input.insight.summary.replace(/\s+/g, " ").trim().slice(0, 150);
  const channelAngle =
    input.channel === "instagram"
      ? "Format this as a visual-first hook + short actionable bullets + one CTA"
      : "Use a value-led narrative with one clear CTA and concrete next step";

  const tonePrefix: Record<string, string> = {
    professional: "Actionable strategy with clear outcomes",
    casual: "Simple practical tip you can apply today",
    witty: "A sharp insight with a useful twist",
    inspirational: "A motivating update with clear action",
  };

  const firstLine = tonePrefix[input.tone ?? ""] ?? tonePrefix.professional;
  const sourceUrl = input.insight.sourceUrl || input.feedItem.postUrl || "";
  const cta = input.style.hasCta
    ? "Comment \"INTERESTED\" and we’ll share details."
    : "Follow for more practical updates.";
  const emoji = input.style.usesEmoji ? " 🚀" : "";

  const hashtags = deriveHashtags({
    topic: input.topic,
    competitorHashtags: input.feedItem.hashtags ?? [],
    preferredHashtags: input.preferredHashtags,
  });

  const sourceLineWithLink = sourceUrl ? `\nSource: ${sourceUrl}` : "";
  let caption = `${firstLine}${emoji}: ${input.insight.title}.\n\nWhy this matters now: ${insightLine}\n\nCompetitor angle (${input.feedItem.handle}): ${sourceLine}.\n${channelAngle}.\n\n${cta}${sourceLineWithLink}\n\n${hashtags.join(" ")}`;

  const maxLength = Math.max(220, Math.min(input.style.avgLength + 80, 600));
  if (caption.length > maxLength) {
    caption = caption.slice(0, maxLength - 1).trimEnd() + "…";
  }

  return caption;
}

function nextDateAtHour(offsetDays: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function POST(request: Request) {
  const tokens = await loadTokens();
  if (!tokens) {
    return NextResponse.json(
      { error: "No social accounts connected. Connect your account first." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as AutopilotPayload;
  const { channels = [], pageId, imageUrl, tone, competitorHint, campaignTopic } = body;
  const preferences = await getResearchPreferences();

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  if (channels.length === 0) {
    return NextResponse.json({ error: "Enable Instagram and/or Facebook rule to generate queue" }, { status: 400 });
  }

  const page = tokens.pages.find((item) => item.id === pageId);
  if (!page) {
    return NextResponse.json(
      { error: "Selected page not found. Reconnect your account and try again." },
      { status: 400 }
    );
  }

  const pageProfile = await getPageProfile(pageId, page.access_token);
  const recentPosts = await getRecentPagePosts(pageId, page.access_token, 15).catch(() => []);
  const recentMessages = recentPosts
    .map((post) => post.message?.trim() ?? "")
    .filter((message) => message.length > 0)
    .slice(0, 12);

  const topic = inferTopicFromAccount({
    explicitTopic: campaignTopic,
    pageName: page.name,
    pageCategory: pageProfile?.category,
    pageDescription: pageProfile?.description || pageProfile?.about,
    recentPostMessages: recentMessages,
  });

  const location = detectPrimaryLocation(`${topic} ${pageProfile?.about ?? ""} ${pageProfile?.description ?? ""} ${recentMessages.join(" ")}`);
  const researchedInsights = await researchTopicInsights({ topic, location, minCount: 7 });
  const fallbackInsights = buildFallbackInsightsFromHistory({
    topic,
    pageName: page.name,
    recentMessages,
  });
  const combinedInsights = buildDistinctInsights({
    researched: researchedInsights,
    fallback: fallbackInsights,
    topic,
    requiredCount: 7,
  });

  const style = buildStyleSignature(recentMessages);

  const competitors = await listCompetitors();
  const userCompetitors = competitors.filter((item) => !item.isSeed);
  if (userCompetitors.length === 0) {
    return NextResponse.json(
      { error: "Please add at least one competitor in Competitor Intelligence before generating autopilot queue." },
      { status: 400 }
    );
  }

  const validHint = competitorHint?.trim().toLowerCase();
  const scopedCompetitors = validHint
    ? userCompetitors.filter((item) => item.handle.toLowerCase() === validHint)
    : userCompetitors;

  const finalCompetitors = scopedCompetitors.length > 0 ? scopedCompetitors : userCompetitors;

  const competitorHandles = new Set(
    finalCompetitors
      .filter((item) => item.handle)
      .map((item) => item.handle.toLowerCase())
  );

  let snapshot = await getResearchSnapshot();
  if (snapshot.items.length === 0) {
    const fetched = await fetchResearchUsingWrapper({
      competitors: finalCompetitors.map((item) => ({
        handle: item.handle,
        channel: item.channel,
      })),
      platforms: preferences.platforms,
      categories: preferences.categories,
      categoryWeights: preferences.categoryWeights,
      customHashtags: preferences.customHashtags,
    });
    if (fetched.items.length > 0) {
      snapshot = await replaceResearchSnapshot({
        items: fetched.items,
        trendingHashtags: fetched.trendingHashtags,
      });
    }
  }

  const researchFeedFromStore = snapshot.items
    .filter((item) => competitorHandles.has(item.competitorHandle.toLowerCase()))
    .map((item) => ({
      id: item.id,
      handle: item.competitorHandle,
      channel: item.channel,
      caption: `${item.title}. ${item.snippet}`,
      hashtags: item.hashtags,
      postedAt: item.fetchedAt,
      postUrl: item.sourceUrl,
    }));

  const researchPool = researchFeedFromStore.length > 0
    ? researchFeedFromStore
    : buildSyntheticFeedFromCompetitors({
        competitors: finalCompetitors.map((item) => ({
          handle: item.handle,
          topHashtags: item.topHashtags,
        })),
        topic,
      });
  const ranked = rankFeedItems({
    items: researchPool,
    competitorHint,
    topic,
  });

  const preferredHashtags = [
    ...preferences.customHashtags,
    ...Object.entries(preferences.categoryWeights)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => `#${category.replace(/\s+/g, "")}`),
    ...snapshot.trendingHashtags.slice(0, 8).map((item) => item.tag),
  ];

  if (ranked.length === 0) {
    return NextResponse.json({ error: "No competitor feed data available. Add competitors first." }, { status: 400 });
  }

  const totalPosts = 7;
  const createdAt = new Date().toISOString();
  const tasks: WeeklyContentTask[] = [];
  const usedCaptions = new Set<string>();

  for (let index = 0; index < totalPosts; index += 1) {
    const channel = channels[index % channels.length] ?? "facebook";
    const feedItem = ranked[index % ranked.length];
    const insight = combinedInsights[index % combinedInsights.length];
    let caption = buildResearchedCaption({
      topic,
      channel,
      feedItem,
      insight,
      style,
      tone,
      preferredHashtags,
    });

    const normalizedCaption = caption.replace(/\s+/g, " ").trim().toLowerCase();
    if (usedCaptions.has(normalizedCaption)) {
      caption = `${caption}\n\nUnique angle ${index + 1}: ${insight.title}`;
    }
    usedCaptions.add(caption.replace(/\s+/g, " ").trim().toLowerCase());

    const resolvedImageUrl = resolveAutopilotImageUrl({
      preferredUrl: imageUrl,
      topic: `${topic} ${insight.title}`,
      competitorHint: feedItem.handle,
      caption: `${insight.title} ${insight.summary}`,
      channel,
      seed: `${pageId}-${feedItem.id}-${index}`,
    });

    tasks.push({
      id: `autopilot-queue-${Date.now()}-${index}`,
      channel,
      pageId,
      pageName: page.name,
      accountHandle: toAccountHandle(page.name),
      competitorHandle: feedItem.handle,
      caption,
      research: {
        title: insight.title,
        summary: insight.summary,
        sourceUrl: insight.sourceUrl,
        inferredTopic: topic,
        basedOn: [
          `competitor:${feedItem.handle}`,
          "account_history",
          "online_research",
        ],
      },
      imageUrl: resolvedImageUrl,
      scheduledAt: nextDateAtHour(index, channel === "instagram" ? 10 : 14),
      status: "review",
      createdAt,
    });
  }

  await upsertWeeklyTasks(tasks);

  return NextResponse.json(
    {
      created: tasks.length,
      mode: "queued_for_review",
      topic,
      location,
      message: "Generated 7 researched queue items from account history + online research. Nothing was posted directly.",
      sample: tasks.slice(0, 2),
    },
    { status: 200 }
  );
}
