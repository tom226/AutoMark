// app/api/hashtags/suggest/route.ts - Hashtag Intelligence Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { generateHashtags } from '@/lib/ai-content'
import { ApiResponse } from '@/lib/types'

interface HashtagSuggestion {
  tag: string
  reach: string
  difficulty: string
  category: 'high' | 'medium' | 'niche'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { caption, niche, count = 10 } = body

    // Validate required fields
    if (!caption || !niche) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: caption, niche',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    // Generate hashtags
    const hashtags = await generateHashtags(caption, niche, count)

    // Categorize hashtags by reach
    const categorized: Record<'high' | 'medium' | 'niche', HashtagSuggestion[]> = {
      high: [],
      medium: [],
      niche: [],
    }

    // Simple categorization (in production, this would come from real data)
    const highReachCount = Math.ceil(count * 0.3)
    const mediumReachCount = Math.ceil(count * 0.4)

    hashtags.forEach((tag, index) => {
      if (index < highReachCount) {
        categorized.high.push({
          tag,
          reach: '1M+',
          difficulty: 'Hard',
          category: 'high',
        })
      } else if (index < highReachCount + mediumReachCount) {
        categorized.medium.push({
          tag,
          reach: '100K-1M',
          difficulty: 'Medium',
          category: 'medium',
        })
      } else {
        categorized.niche.push({
          tag,
          reach: '<100K',
          difficulty: 'Easy',
          category: 'niche',
        })
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          hashtags,
          categorized,
          recommendation: `Use ${highReachCount} high-reach + ${mediumReachCount} medium + ${count - highReachCount - mediumReachCount} niche hashtags`,
          estimatedReach: '+2,400 impressions',
        },
      } as ApiResponse<any>,
      { status: 200 },
    )
  } catch (error) {
    console.error('POST /api/hashtags/suggest error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hashtag suggestions',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const niche = searchParams.get('niche')

    if (!niche) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: niche',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    // Return trending hashtags for niche (mock data)
    const trendingHashtags = {
      restaurant: [
        '#foodlover',
        '#foodinstagram',
        '#indianfood',
        '#foodie',
        '#delicious',
        '#foodblogger',
        '#yummy',
        '#homemade',
      ],
      fashion: [
        '#fashionista',
        '#ootd',
        '#fashion',
        '#style',
        '#clothes',
        '#shopping',
        '#fashionblogger',
        '#trendy',
      ],
      fitness: [
        '#fitnessmotivation',
        '#gym',
        '#workout',
        '#fit',
        '#health',
        '#exercise',
        '#bodybuilding',
        '#fitnessjourney',
      ],
      beauty: [
        '#beautiful',
        '#makeup',
        '#skincare',
        '#beautyblogger',
        '#cosmetics',
        '#selfcare',
        '#glowup',
        '#beauty',
      ],
    }

    const hashtags = (trendingHashtags as any)[niche] || trendingHashtags.restaurant

    return NextResponse.json(
      {
        success: true,
        data: {
          niche,
          trending: hashtags,
          message: `Showing trending hashtags for ${niche}`,
        },
      } as ApiResponse<any>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/hashtags/suggest error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch hashtags',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
