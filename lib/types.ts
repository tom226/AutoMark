export type Channel = "instagram" | "facebook" | "linkedin" | "twitter";

export type PostStatus = "draft" | "scheduled" | "published" | "failed" | "autopilot";

export interface ContentItem {
  id: string;
  channel: Channel;
  caption: string;
  hashtags: string[];
  scheduledAt: string;
  status: PostStatus;
  imageUrl?: string;
  likes?: number;
  comments?: number;
  reach?: number;
  isAutopilot?: boolean;
}

export interface Competitor {
  id: string;
  handle: string;
  channel: Channel;
  postsPerWeek: number;
  avgEngagement: number;
  topHashtags: string[];
  lastActivity: string;
}

export interface CompetitorFeedItem {
  id: string;
  handle: string;
  channel: Channel;
  caption: string;
  hashtags: string[];
  postedAt: string;
  postUrl?: string;
}

export type ExperimentVariantKey = "A" | "B";

export interface ExperimentVariant {
  key: ExperimentVariantKey;
  caption: string;
  impressions: number;
  engagements: number;
}

export interface Experiment {
  id: string;
  channel: Channel;
  pageId?: string;
  topic?: string;
  status: "running" | "completed";
  winner?: ExperimentVariantKey;
  variants: [ExperimentVariant, ExperimentVariant];
  createdAt: string;
  completedAt?: string;
}

export interface AutopilotRule {
  id: string;
  channel: Channel;
  enabled: boolean;
  postsPerDay: number;
  bestTimeSlots: string[];
  competitorId?: string;
  tone: string;
}

export interface ConnectedAccount {
  channel: Channel;
  handle: string;
  connected: boolean;
  avatar?: string;
}

export interface AnalyticsSummary {
  totalPosts: number;
  totalReach: number;
  totalEngagement: number;
  scheduledCount: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

