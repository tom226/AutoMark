import { buildAutopilotCaptionFromContext } from "@/lib/autopilot-caption";
import { listCompetitors } from "@/lib/competitor-store";
import { getResearchPreferences } from "@/lib/research-preferences-store";
import { getResearchSnapshot } from "@/lib/research-store";
import { upsertWeeklyTasks, type WeeklyContentTask } from "@/lib/task-folder-store";
import { resolveAutopilotImageUrl } from "@/lib/autopilot-image";
import { loadTokens } from "@/lib/token-store";

export interface PostAutomationRequest {
  pageId?: string;
  channels?: Array<"instagram" | "facebook">;
  postsPerWeek?: number;
  weeks?: number;
  goal?: "engagement" | "awareness" | "leads" | "sales";
  campaignTopic?: string;
  tone?: string;
  saveToQueue?: boolean;
}

export interface AutomationDraft {
  task: WeeklyContentTask;
  hashtags: string[];
  pillar: string;
  reason: string;
}

export interface PostAutomationResult {
  generated: number;
  queueSaved: number;
  selectedPage?: { id: string; name: string };
  bestPracticesApplied: string[];
  drafts: AutomationDraft[];
}

type Goal = NonNullable<PostAutomationRequest["goal"]>;

const CHANNEL_TIME_SLOTS: Record<"instagram" | "facebook", Array<{ dayOffset: number; hour: number }>> = {
  instagram: [
    { dayOffset: 1, hour: 11 },
    { dayOffset: 2, hour: 8 },
    { dayOffset: 3, hour: 11 },
    { dayOffset: 4, hour: 9 },
  ],
  facebook: [
    { dayOffset: 1, hour: 9 },
    { dayOffset: 2, hour: 8 },
    { dayOffset: 3, hour: 13 },
    { dayOffset: 4, hour: 10 },
  ],
};

const GOAL_CTA: Record<Goal, string> = {
  engagement: "Ask a direct question in the first comment and respond quickly.",
  awareness: "Introduce one clear brand message and keep it repeatable.",
  leads: "Invite users to comment a keyword for details or send a DM.",
  sales: "Use one clear offer and one single call-to-action.",
};

const GOAL_PILLARS: Record<Goal, string[]> = {
  engagement: ["quick tip", "conversation starter", "myth vs fact", "community spotlight"],
  awareness: ["brand story", "trend reaction", "beginner guide", "behind the scenes"],
  leads: ["problem-solution", "case snapshot", "checklist post", "FAQ post"],
  sales: ["feature benefit", "social proof", "offer reminder", "objection handling"],
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeChannelList(input?: Array<"instagram" | "facebook">): Array<"instagram" | "facebook"> {
  if (!input || input.length === 0) return ["instagram", "facebook"];
  const set = new Set(input.filter((channel) => channel === "instagram" || channel === "facebook"));
  return set.size > 0 ? [...set] : ["instagram", "facebook"];
}

function nextSlotDate(slot: { dayOffset: number; hour: number }, cycle: number): string {
  const d = new Date();
  d.setDate(d.getDate() + slot.dayOffset + cycle * 7);
  d.setHours(slot.hour, 0, 0, 0);
  return d.toISOString();
}

function normalizeHashtag(value: string): string {
  const clean = value.toLowerCase().replace(/[^a-z0-9#]/g, "").trim();
  if (!clean) return "";
  return clean.startsWith("#") ? clean : `#${clean}`;
}

function pickHashtags(input: {
  channel: "instagram" | "facebook";
  categories: string[];
  trendingTags: string[];
  customHashtags: string[];
  competitorTags: string[];
}): string[] {
  const categoryTokens = input.categories.map((item) => item.toLowerCase());
  const pool = [
    ...input.customHashtags,
    ...input.trendingTags,
    ...input.competitorTags,
    "#socialmedia",
    "#contentmarketing",
  ]
    .map(normalizeHashtag)
    .filter((item) => item.length > 2);

  const unique = [...new Set(pool)];
  const categoryMatch = unique.filter((tag) => categoryTokens.some((token) => tag.includes(token)));
  const channelSpecific = input.channel === "instagram" ? ["#instagramtips", "#reelsstrategy"] : ["#facebookmarketing", "#communitygrowth"];

  return [...new Set([...categoryMatch, ...unique, ...channelSpecific])].slice(0, 6);
}

function toAccountHandle(pageName: string): string {
  const base = pageName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  return `@${base || "socialaccount"}`;
}

function inferTopic(baseTopic: string, pillar: string): string {
  return `${baseTopic}: ${pillar}`;
}

export async function generateAutomatedPostPlan(input: PostAutomationRequest): Promise<PostAutomationResult> {
  const postsPerWeek = clamp(Math.round(input.postsPerWeek ?? 6), 2, 28);
  const weeks = clamp(Math.round(input.weeks ?? 1), 1, 4);
  const goal: Goal = input.goal ?? "engagement";
  const tone = input.tone?.trim() || "professional";
  const channels = normalizeChannelList(input.channels);

  const [prefs, research, competitors, tokens] = await Promise.all([
    getResearchPreferences(),
    getResearchSnapshot(),
    listCompetitors(),
    loadTokens(),
  ]);

  const selectedPage = tokens?.pages.find((page) => page.id === input.pageId) ?? tokens?.pages[0];
  if (input.saveToQueue && !selectedPage) {
    throw new Error("Connect social accounts first to save generated drafts into queue.");
  }

  const categories = prefs.categories.length > 0 ? prefs.categories : ["marketing", "business"];
  const baseTopic = input.campaignTopic?.trim() || categories.slice(0, 2).join(" and ");
  const trendTags = research.trendingHashtags.map((item) => item.tag);
  const activeCompetitors = competitors.some((item) => !item.isSeed)
    ? competitors.filter((item) => !item.isSeed)
    : competitors;

  const bestPracticesApplied = [
    "Batch generation with reusable content pillars",
    "Channel-specific timing slots for consistent publishing",
    "Research-backed hashtag and topic selection",
    "Goal-based CTA so automation stays outcome-focused",
    "Human review mode before publish to protect brand tone",
  ];

  const pillars = [
    ...GOAL_PILLARS[goal],
    ...categories.map((category) => `${category} how-to`),
  ];

  const totalPosts = postsPerWeek * weeks;
  const drafts: AutomationDraft[] = [];

  for (let index = 0; index < totalPosts; index += 1) {
    const channel = channels[index % channels.length];
    const pillar = pillars[index % pillars.length];
    const competitor = activeCompetitors[index % Math.max(activeCompetitors.length, 1)];
    const competitorHandle = competitor?.handle ?? "@marketleader";
    const competitorTags = competitor?.topHashtags ?? [];
    const hashtags = pickHashtags({
      channel,
      categories,
      customHashtags: prefs.customHashtags,
      trendingTags: trendTags,
      competitorTags,
    });

    const topic = inferTopic(baseTopic, pillar);
    const baseCaption = await buildAutopilotCaptionFromContext({
      channel,
      tone,
      campaignTopic: topic,
      competitorHint: competitorHandle,
    });

    const caption = `${baseCaption}\n\n${GOAL_CTA[goal]}\n${hashtags.join(" ")}`;
    const cycle = Math.floor(index / postsPerWeek);
    const slotIndex = Math.floor(index / channels.length) % CHANNEL_TIME_SLOTS[channel].length;
    const scheduledAt = nextSlotDate(CHANNEL_TIME_SLOTS[channel][slotIndex], cycle);
    const taskId = `batch-${Date.now()}-${index}`;

    const task: WeeklyContentTask = {
      id: taskId,
      channel,
      pageId: selectedPage?.id ?? "draft-page",
      pageName: selectedPage?.name ?? "Draft Page",
      accountHandle: toAccountHandle(selectedPage?.name ?? "Draft Page"),
      competitorHandle,
      caption,
      research: {
        title: `Automated ${goal} draft`,
        summary: `Generated from ${pillar} pillar with research-guided hashtags and CTA strategy.`,
        inferredTopic: topic,
        basedOn: ["content_pillar", "research_signals", "goal_cta"],
      },
      imageUrl: resolveAutopilotImageUrl({
        topic,
        competitorHint: competitorHandle,
        caption,
        channel,
        seed: taskId,
      }),
      scheduledAt,
      status: "review",
      createdAt: new Date().toISOString(),
    };

    drafts.push({
      task,
      hashtags,
      pillar,
      reason: `Built for ${goal} using ${pillar} pillar and ${channel} timing window.`,
    });
  }

  if (input.saveToQueue) {
    await upsertWeeklyTasks(drafts.map((item) => item.task));
  }

  return {
    generated: drafts.length,
    queueSaved: input.saveToQueue ? drafts.length : 0,
    selectedPage: selectedPage ? { id: selectedPage.id, name: selectedPage.name } : undefined,
    bestPracticesApplied,
    drafts,
  };
}
