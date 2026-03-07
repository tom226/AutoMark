// app/api/trends/route.ts - Trending Topics Feed Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'

interface TrendingItem {
  id: string
  type: 'hashtag' | 'audio' | 'meme' | 'hook' | 'festival'
  title: string
  description: string
  reach: number
  momentum: 'rising' | 'stable' | 'declining'
  relatedHashtags: string[]
  actionUrl: string
  icon: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const niche = searchParams.get('niche') || 'general'
    const language = searchParams.get('language') || 'en'

    // Mock trending data for India
    const trendingTopics: TrendingItem[] = [
      {
        id: 'trend_1',
        type: 'hashtag',
        title: '#IndianStartups',
        description: 'Startups making waves in India',
        reach: 2400000,
        momentum: 'rising',
        relatedHashtags: ['#entrepreneurship', '#innovation', '#tech'],
        actionUrl: '/compose?topic=IndianStartups',
        icon: '🚀',
      },
      {
        id: 'trend_2',
        type: 'festival',
        title: 'Diwali Preparation',
        description: 'Content ideas for Diwali season',
        reach: 5600000,
        momentum: 'rising',
        relatedHashtags: ['#diwali', '#festivities', '#shopping'],
        actionUrl: '/compose?topic=diwali',
        icon: '🪔',
      },
      {
        id: 'trend_3',
        type: 'meme',
        title: 'Reel Trends - Dancing',
        description: 'Popular dance formats and audio',
        reach: 3200000,
        momentum: 'stable',
        relatedHashtags: ['#reels', '#dancing', '#viral'],
        actionUrl: '/compose?type=reel&topic=dance',
        icon: '💃',
      },
      {
        id: 'trend_4',
        type: 'hook',
        title: 'Behind-the-Scenes Content',
        description: 'Authentic BTS content is getting high engagement',
        reach: 1800000,
        momentum: 'rising',
        relatedHashtags: ['#bts', '#authentic', '#dayinmylife'],
        actionUrl: '/compose?topic=behind-the-scenes',
        icon: '🎥',
      },
      {
        id: 'trend_5',
        type: 'audio',
        title: 'Trending Bollywood Audio',
        description: 'Latest Bollywood song being used in Reels',
        reach: 4100000,
        momentum: 'stable',
        relatedHashtags: ['#bollywood', '#music', '#reels'],
        actionUrl: '/compose?type=reel',
        icon: '🎵',
      },
    ]

    // Filter by niche (mock logic)
    let filtered = trendingTopics

    if (niche && niche !== 'general') {
      const nicheFilters: Record<string, string[]> = {
        restaurant: ['#food', '#foodie', '#cooking'],
        fashion: ['#outfit', '#style', '#ootd'],
        fitness: ['#workout', '#gym', '#fitnessjourney'],
      }

      const keywords = nicheFilters[niche] || []
      if (keywords.length > 0) {
        // In real app, would filter by niche
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          trends: filtered,
          refreshedAt: new Date().toISOString(),
          refreshIn: 4 * 60 * 60 * 1000, // 4 hours
          message: `Showing ${filtered.length} trending topics for ${niche}`,
        },
      } as ApiResponse<any>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/trends error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch trending topics',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
