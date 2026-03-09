// AutoMark Core Types

export interface User {
  id: string
  email: string
  phone?: string
  name?: string
  language: 'en' | 'hi'
  niche?: string
  postingGoal: number
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface SocialAccount {
  id: string
  userId: string
  platform: SocialPlatform
  username: string
  accountName?: string
  followersCount: number
  isConnected: boolean
  lastSyncedAt?: Date
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'gmb'
  | 'whatsapp'

// Canonical publishing/research channels used across API and UI modules.
export type Channel =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'sharechat'
  | 'moj'
  | 'josh'

export interface Competitor {
  id: string
  handle: string
  channel: Channel
  postsPerWeek: number
  avgEngagement: number
  topHashtags: string[]
  lastActivity: string
}

export interface CompetitorFeedItem {
  id: string
  handle: string
  channel: Channel
  caption: string
  hashtags: string[]
  postedAt: string
  postUrl: string
}

export type ExperimentVariantKey = 'A' | 'B'

export interface ExperimentVariant {
  key: ExperimentVariantKey
  caption: string
  impressions: number
  engagements: number
}

export interface Experiment {
  id: string
  channel: Channel
  pageId?: string
  topic?: string
  status: 'running' | 'completed'
  variants: [ExperimentVariant, ExperimentVariant]
  winner?: ExperimentVariantKey
  createdAt: string
  completedAt?: string
}

export interface AutopilotRule {
  id: string
  channel: Channel
  enabled: boolean
  postsPerDay: number
  bestTimeSlots: string[]
  competitorId?: string
  tone: 'professional' | 'casual' | 'witty' | 'inspirational'
}

export interface Post {
  id: string
  userId: string
  caption: string
  hashtags: string[]
  mediaUrls: string[]
  status: PostStatus
  platforms: SocialPlatform[]
  scheduledFor?: Date
  publishedAt?: Date
  tone: PostTone
  isAIGenerated: boolean
  createdAt: Date
}

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'
export type PostTone = 'professional' | 'casual' | 'funny' | 'emotional' | 'urgent'

export interface PostVariant {
  caption: string
  tone: PostTone
  hashtags: string[]
}

export interface AIContentRequest {
  keyword?: string
  topic?: string
  niche: string
  tone?: PostTone
  platform?: SocialPlatform
  language?: 'en' | 'hi'
  hashtag?: boolean
  emoji?: boolean
}

export interface AIContentResponse {
  variants: PostVariant[]
  suggestions: string[]
}

export interface UserAnalytics {
  automarkScore: number
  consistency: number
  engagement: number
  growth: number
  reach: number
  responseRate: number
  postsThisWeek: number
  newFollowersThisWeek: number
  totalReach: number
  avgEngagementRate: number
}

export interface AutoMarkScore {
  score: number // 0-100
  consistency: number // 0-100
  engagement: number // 0-100
  growth: number // 0-100
  reach: number // 0-100
  responseRate: number // 0-100
  delta: number // change vs last week
  tips: string[]
  nextMilestone?: string
}

export interface InboxMessage {
  id: string
  platform: SocialPlatform
  senderName: string
  senderHandle: string
  messageText: string
  sentiment: 'positive' | 'negative' | 'neutral'
  status: MessageStatus
  receivedAt: Date
}

export type MessageStatus = 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED' | 'STARRED'

export interface SuggestedReply {
  text: string
  reasoning: string
}

export interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastPostDate?: Date
  shieldUsedCount: number
}

export interface UserBadge {
  id: string
  type: BadgeType
  name: string
  icon: string
  unlockedAt: Date
}

export type BadgeType =
  | 'first_post'
  | 'on_fire'
  | 'century'
  | 'growth_hacker'
  | 'viral_moment'
  | 'consistent_creator'
  | 'thousand_club'
  | 'perfect_score'
  | 'social_legend'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  sentAt: Date
}

export type NotificationType =
  | 'morning_brief'
  | 'viral_alert'
  | 'streak_nudge'
  | 'analytics_ready'
  | 'inbox_message'
  | 'post_published'
  | 'score_improved'

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: Date
  renewalDate?: Date
  amount: number
  currency: string
}

export type SubscriptionPlan = 'FREE' | 'STARTER' | 'PRO' | 'AGENCY' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED'

export interface PlanFeatures {
  accountsLimit: number
  postsPerMonth: number
  aiCaptions: number
  teamMembers: number
  whiteLabel: boolean
  apiAccess: boolean
  customAnalytics: boolean
}

export const PLAN_FEATURES: Record<SubscriptionPlan, PlanFeatures> = {
  FREE: {
    accountsLimit: 3,
    postsPerMonth: 15,
    aiCaptions: 5,
    teamMembers: 1,
    whiteLabel: false,
    apiAccess: false,
    customAnalytics: false,
  },
  STARTER: {
    accountsLimit: 10,
    postsPerMonth: 999,
    aiCaptions: 999,
    teamMembers: 1,
    whiteLabel: false,
    apiAccess: false,
    customAnalytics: false,
  },
  PRO: {
    accountsLimit: 25,
    postsPerMonth: 999,
    aiCaptions: 999,
    teamMembers: 3,
    whiteLabel: true,
    apiAccess: false,
    customAnalytics: true,
  },
  AGENCY: {
    accountsLimit: 999,
    postsPerMonth: 999,
    aiCaptions: 999,
    teamMembers: 999,
    whiteLabel: true,
    apiAccess: true,
    customAnalytics: true,
  },
  ENTERPRISE: {
    accountsLimit: 999,
    postsPerMonth: 999,
    aiCaptions: 999,
    teamMembers: 999,
    whiteLabel: true,
    apiAccess: true,
    customAnalytics: true,
  },
}

// Festival dates in India
export const INDIAN_FESTIVALS = [
  { name: 'Makar Sankranti', date: '2026-01-14', category: 'hindu' },
  { name: 'Republic Day', date: '2026-01-26', category: 'national' },
  { name: 'Lohri', date: '2026-01-13', category: 'hindu' },
  { name: 'Pongal', date: '2026-01-14', category: 'hindu' },
  { name: 'Holi', date: '2026-03-29', category: 'hindu' },
  { name: 'Women\'s Day', date: '2026-03-08', category: 'secular' },
  { name: 'Ugadi', date: '2026-03-23', category: 'hindu' },
  { name: 'Baisakhi', date: '2026-04-13', category: 'sikh' },
  { name: 'Ambedkar Jayanti', date: '2026-04-14', category: 'national' },
  { name: 'Independence Day', date: '2026-08-15', category: 'national' },
  { name: 'Raksha Bandhan', date: '2026-08-09', category: 'hindu' },
  { name: 'Janmashtami', date: '2026-08-26', category: 'hindu' },
  { name: 'Ganesh Chaturthi', date: '2026-09-02', category: 'hindu' },
  { name: 'Teacher\'s Day', date: '2026-09-05', category: 'secular' },
  { name: 'Navratri', date: '2026-10-02', category: 'hindu' },
  { name: 'Dussehra', date: '2026-10-12', category: 'hindu' },
  { name: 'Diwali', date: '2026-10-29', category: 'hindu' },
  { name: 'Dhanteras', date: '2026-10-27', category: 'hindu' },
  { name: 'Gandhi Jayanti', date: '2026-10-02', category: 'national' },
  { name: 'Christmas', date: '2026-12-25', category: 'christian' },
]

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

