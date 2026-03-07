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
    // Return mock user's current score
    const mockScore: AutoMarkScore = {
      score: 78,
      consistency: 85,
      engagement: 72,
      growth: 65,
      reach: 80,
      responseRate: 75,
      delta: 5,
      tips: [
        '💡 Post 1 more time to reach your goal',
        '💡 Your Reels get 3x more engagement — post more video content',
        '🎉 Great job maintaining a 7-day streak!',
      ],
      nextMilestone: 'Reach Score 85 — Unlock white-label reports',
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...mockScore,
          color: getScoreColor(mockScore.score),
          formatted: formatScore(mockScore.score),
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
