// lib/gamification.ts - AutoMark Gamification & Scoring System

import { AutoMarkScore, UserBadge, BadgeType } from './types'

/**
 * Calculate AutoMark Score (0-100) based on 5 key metrics
 */
export function calculateAutoMarkScore(
  consistency: number,
  engagement: number,
  growth: number,
  reach: number,
  responseRate: number,
): AutoMarkScore {
  // Weighted calculation
  const score = Math.round(
    consistency * 0.25 + engagement * 0.3 + growth * 0.2 + reach * 0.15 + responseRate * 0.1,
  )

  return {
    score: Math.min(100, Math.max(0, score)),
    consistency,
    engagement,
    growth,
    reach,
    responseRate,
    delta: 0, // Will be calculated against previous week
    tips: generateScoreTips(score, consistency, engagement, growth, reach, responseRate),
    nextMilestone: getNextMilestone(score),
  }
}

/**
 * Calculate consistency score (0-100)
 * Based on posting frequency vs. user's goal
 */
export function calculateConsistencyScore(
  postsThisWeek: number,
  postingGoalPerWeek: number,
): number {
  if (postingGoalPerWeek === 0) return 0

  const ratio = postsThisWeek / postingGoalPerWeek
  const score = Math.min(ratio * 100, 100)

  return Math.round(score)
}

/**
 * Calculate engagement score (0-100)
 * Based on average engagement rate vs. industry benchmark
 */
export function calculateEngagementScore(
  avgEngagementRate: number,
  industryBenchmark: number = 2.5,
): number {
  const ratio = avgEngagementRate / industryBenchmark
  const score = Math.min(ratio * 50, 100)

  return Math.round(score)
}

/**
 * Calculate growth score (0-100)
 * Based on net new followers this week
 */
export function calculateGrowthScore(
  newFollowersWeek: number,
  totalFollowers: number,
): number {
  if (totalFollowers === 0) return 0

  const growthRate = (newFollowersWeek / Math.max(totalFollowers, 1)) * 100
  // 2% weekly growth = 100 score
  const score = Math.min((growthRate / 2) * 100, 100)

  return Math.round(score)
}

/**
 * Calculate reach score (0-100)
 * Based on average reach vs. follower baseline
 */
export function calculateReachScore(
  avgReach: number,
  totalFollowers: number,
): number {
  // Baseline: 20% of followers as average reach
  const baseline = totalFollowers * 0.2
  if (baseline === 0) return 0

  const ratio = avgReach / baseline
  const score = Math.min(ratio * 100, 150)

  return Math.round(Math.min(score, 100))
}

/**
 * Calculate response rate score (0-100)
 * Based on replies within 24 hours
 */
export function calculateResponseRateScore(
  messagesReplied: number,
  totalMessages: number,
): number {
  if (totalMessages === 0) return 50 // Default neutral score

  const responseRate = (messagesReplied / totalMessages) * 100
  return Math.round(Math.min(responseRate, 100))
}

/**
 * Check for badge unlocks
 */
export function checkBadgeUnlocks(
  userId: string,
  postsPublished: number,
  currentStreak: number,
  totalFollowers: number,
  score: number,
  viralPostCount: number,
): BadgeType[] {
  const unlocked: BadgeType[] = []

  // First post badge
  if (postsPublished === 1) {
    unlocked.push('first_post')
  }

  // On fire (7-day streak)
  if (currentStreak >= 7) {
    unlocked.push('on_fire')
  }

  // Century (100 followers)
  if (totalFollowers >= 100 && postsPublished >= 10) {
    unlocked.push('century')
  }

  // Growth hacker (+100 followers in 1 week)
  // This would need to be checked against previous week data

  // Viral moment (post with 1000+ likes)
  if (viralPostCount >= 1) {
    unlocked.push('viral_moment')
  }

  // Consistent creator (30-day streak)
  if (currentStreak >= 30) {
    unlocked.push('consistent_creator')
  }

  // Thousand club (1000 followers)
  if (totalFollowers >= 1000) {
    unlocked.push('thousand_club')
  }

  // Perfect score (90+ AutoMark score)
  if (score >= 90) {
    unlocked.push('perfect_score')
  }

  // Social legend (365-day streak + 85+ score)
  if (currentStreak >= 365 && score >= 85) {
    unlocked.push('social_legend')
  }

  return unlocked
}

/**
 * Get the next milestone for user
 */
function getNextMilestone(score: number): string | undefined {
  if (score < 50) {
    return 'Reach Score 50 — Start building momentum'
  }
  if (score < 70) {
    return 'Reach Score 70 — You\'re getting good traction'
  }
  if (score < 85) {
    return 'Reach Score 85 — Unlock white-label reports'
  }
  if (score < 100) {
    return 'Reach Score 100 — Perfect health status'
  }
  return undefined
}

/**
 * Generate actionable tips based on scores
 */
function generateScoreTips(
  total: number,
  consistency: number,
  engagement: number,
  growth: number,
  reach: number,
  responseRate: number,
): string[] {
  const tips: string[] = []

  if (consistency < 50) {
    tips.push('💡 Post more consistently. Your goal is 3x/week — you\'re at 2x/week. Post 1 more time today!')
  }

  if (engagement < 50) {
    tips.push(
      '💡 Your engagement is low. Try Reels instead of static posts — video gets 3x more engagement.',
    )
  }

  if (growth < 50) {
    tips.push('💡 Growth is slower than average. Use trending hashtags and reply to every comment.')
  }

  if (reach < 50) {
    tips.push('💡 Your posts aren\'t reaching enough people. Post at peak hours (8-10 AM, 8-11 PM IST).')
  }

  if (responseRate < 50) {
    tips.push('💡 You\'re not replying to messages fast enough. Enable AutoMark Smart Replies.')
  }

  // Positive reinforcement
  if (total >= 90) {
    tips.push('🎉 Amazing work! You\'re a Social Legend. Keep up this momentum!')
  } else if (total >= 70) {
    tips.push('🚀 You\'re doing great! Just a bit more consistency to reach 85.')
  } else if (total >= 50) {
    tips.push('📈 You\'re on the right track. Focus on one weak area to improve faster.')
  }

  return tips.slice(0, 3) // Return top 3 tips
}

/**
 * Define badge metadata
 */
export const BADGES: Record<BadgeType, UserBadge & { color: string }> = {
  first_post: {
    id: 'first_post',
    type: 'first_post',
    name: 'Newcomer',
    icon: '🌱',
    color: 'green',
    unlockedAt: new Date(),
  },
  on_fire: {
    id: 'on_fire',
    type: 'on_fire',
    name: 'On Fire',
    icon: '🔥',
    color: 'red',
    unlockedAt: new Date(),
  },
  century: {
    id: 'century',
    type: 'century',
    name: 'Century',
    icon: '💯',
    color: 'yellow',
    unlockedAt: new Date(),
  },
  growth_hacker: {
    id: 'growth_hacker',
    type: 'growth_hacker',
    name: 'Growth Hacker',
    icon: '📈',
    color: 'blue',
    unlockedAt: new Date(),
  },
  viral_moment: {
    id: 'viral_moment',
    type: 'viral_moment',
    name: 'Viral Moment',
    icon: '🚀',
    color: 'purple',
    unlockedAt: new Date(),
  },
  consistent_creator: {
    id: 'consistent_creator',
    type: 'consistent_creator',
    name: 'Consistent Creator',
    icon: '💎',
    color: 'cyan',
    unlockedAt: new Date(),
  },
  thousand_club: {
    id: 'thousand_club',
    type: 'thousand_club',
    name: 'Thousand Club',
    icon: '👑',
    color: 'gold',
    unlockedAt: new Date(),
  },
  perfect_score: {
    id: 'perfect_score',
    type: 'perfect_score',
    name: 'Perfect Score',
    icon: '🎯',
    color: 'green',
    unlockedAt: new Date(),
  },
  social_legend: {
    id: 'social_legend',
    type: 'social_legend',
    name: 'Social Legend',
    icon: '🌟',
    color: 'gold',
    unlockedAt: new Date(),
  },
}

/**
 * Stringify a PostStreak for display
 */
export function formatStreak(days: number): string {
  if (days === 0) return 'No streak yet — post today to start!'
  if (days === 1) return '🔥 1-day streak'
  if (days === 7) return '🔥 7-day streak'
  if (days === 30) return '💎 30-day streak'
  if (days >= 365) return '🌟 365+ day streak'

  return `🔥 ${days}-day streak`
}

/**
 * Check if user should get a streak nudge
 */
export function shouldSendStreakNudge(
  lastPostDate: Date | null,
  currentStreak: number,
): boolean {
  if (currentStreak === 0) return false

  const now = new Date()
  const daysSinceLastPost =
    lastPostDate ? Math.floor((now.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60 * 24)) : 999

  // Nudge at 20:00 IST if no post today
  return daysSinceLastPost >= 1
}

/**
 * Calculate level based on posts and streak
 */
export function calculateUserLevel(postsPublished: number, currentStreak: number): number {
  // Level 1: Beginner (0 posts)
  if (postsPublished === 0) return 1

  // Level 2: Creator (10 posts)
  if (postsPublished >= 10) return 2

  // Level 3: Influencer (50 posts + 7-day streak)
  if (postsPublished >= 50 && currentStreak >= 7) return 3

  // Level 4: Brand (100 posts + 30-day streak)
  if (postsPublished >= 100 && currentStreak >= 30) return 4

  // Level 5: Legend (365-day streak)
  if (currentStreak >= 365) return 5

  return 1
}

/**
 * Get level name
 */
export function getLevelName(level: number): string {
  const names = ['Unknown', 'Beginner', 'Creator', 'Influencer', 'Brand', 'Legend']
  return names[Math.min(level, names.length - 1)]
}

/**
 * Format AutoMark Score for display
 */
export function formatScore(score: number): string {
  if (score >= 90) return `${score} 🟢 Legend`
  if (score >= 70) return `${score} 🟡 Good`
  if (score >= 50) return `${score} 🟠 Fair`
  return `${score} 🔴 Needs Work`
}

/**
 * Get score color for UI
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981' // green
  if (score >= 70) return '#f59e0b' // amber
  if (score >= 50) return '#f97316' // orange
  return '#ef4444' // red
}

/**
 * Calculate weekly score delta
 */
export function calculateScoreDelta(
  currentScore: number,
  previousScore: number,
): { delta: number; trend: 'up' | 'down' | 'stable' } {
  const delta = currentScore - previousScore

  return {
    delta: Math.abs(delta),
    trend: delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable',
  }
}
