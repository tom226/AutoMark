// app/api/analytics/score/route.ts - AutoMark Score Endpoint

import { NextRequest, NextResponse } from 'next/server'
import {
  calculateAutoMarkScore,
  calculateConsistencyScore,
  calculateEngagementScore,
  calculateGrowthScore,
  calculateReachScore,
  calculateResponseRateScore,
  formatScore,
  getScoreColor,
} from '@/lib/gamification'
import { AutoMarkScore, ApiResponse } from '@/lib/types'
import { getOnboardingProfile } from '@/lib/onboarding-store'
import { listWeeklyTasks } from '@/lib/task-folder-store'
import { getUserIdFromRequest } from '@/lib/user-session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      postsThisWeek,
      postingGoal,
      avgEngagementRate,
      newFollowersWeek,
      totalFollowers,
      avgReach,
      messagesReplied,
      totalMessages,
    } = body

    // Calculate individual scores
    const consistency = calculateConsistencyScore(postsThisWeek, postingGoal)
    const engagement = calculateEngagementScore(avgEngagementRate)
    const growth = calculateGrowthScore(newFollowersWeek, totalFollowers)
    const reach = calculateReachScore(avgReach, totalFollowers)
    const responseRate = calculateResponseRateScore(messagesReplied, totalMessages)

    // Calculate overall AutoMark Score
    const score = calculateAutoMarkScore(consistency, engagement, growth, reach, responseRate)

    return NextResponse.json(
      {
        success: true,
        data: {
          ...score,
          color: getScoreColor(score.score),
          formatted: formatScore(score.score),
          breakdown: {
            consistency: `${consistency}/100 — Posting ${postsThisWeek}/${postingGoal} per week`,
            engagement: `${engagement}/100 — Average ${avgEngagementRate.toFixed(1)}% engagement`,
            growth: `${growth}/100 — +${newFollowersWeek} followers this week`,
            reach: `${reach}/100 — Average ${avgReach} reach per post`,
            responseRate: `${responseRate}/100 — Replied to ${messagesReplied}/${totalMessages} messages`,
          },
        },
        message: `AutoMark Score: ${formatScore(score.score)}`,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('POST /api/analytics/score error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate score',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const profile = await getOnboardingProfile(userId)
    const tasks = await listWeeklyTasks(userId)

    const now = Date.now()
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000

    const postedThisWeek = tasks.filter((task) => {
      if (task.status !== 'posted') return false
      const postedAt = task.postedAt ? new Date(task.postedAt).getTime() : NaN
      return Number.isFinite(postedAt) && postedAt >= oneWeekAgo
    })

    const postsThisWeek = postedThisWeek.length
    const postingGoal = profile.postingGoal || 4

    // Until platform insights are synced, keep unavailable metrics at neutral defaults.
    const avgEngagementRate = 0
    const newFollowersWeek = 0
    const totalFollowers = 0
    const avgReach = 0
    const messagesReplied = 0
    const totalMessages = 0

    const consistency = calculateConsistencyScore(postsThisWeek, postingGoal)
    const engagement = calculateEngagementScore(avgEngagementRate)
    const growth = calculateGrowthScore(newFollowersWeek, totalFollowers)
    const reach = calculateReachScore(avgReach, totalFollowers)
    const responseRate = calculateResponseRateScore(messagesReplied, totalMessages)

    const liveScore: AutoMarkScore = {
      ...calculateAutoMarkScore(consistency, engagement, growth, reach, responseRate),
      delta: 0,
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...liveScore,
          color: getScoreColor(liveScore.score),
          formatted: formatScore(liveScore.score),
          source: {
            postsThisWeek,
            postingGoal,
            metricsSynced: false,
          },
        },
      } as ApiResponse<any>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/analytics/score error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch score',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
