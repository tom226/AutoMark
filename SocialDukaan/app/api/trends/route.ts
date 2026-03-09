// app/api/trends/route.ts - Trending Topics Feed Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/types'
import { getResearchSnapshot } from '@/lib/research-store'

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

function normalizeTag(tag: string): string {
  return tag.replace(/^#+/, '').trim().toLowerCase()
}

function toMomentum(count: number): TrendingItem['momentum'] {
  if (count >= 15) return 'rising'
  if (count >= 6) return 'stable'
  return 'declining'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const niche = searchParams.get('niche') || 'general'
    const language = searchParams.get('language') || 'en'

    const snapshot = await getResearchSnapshot()
    const itemByTag = new Map<string, Set<string>>()

    for (const item of snapshot.items) {
      const normalized = item.hashtags.map((tag) => normalizeTag(tag)).filter(Boolean)
      for (const tag of normalized) {
        if (!itemByTag.has(tag)) itemByTag.set(tag, new Set<string>())
        const relatedSet = itemByTag.get(tag)
        if (!relatedSet) continue
        for (const rel of normalized) {
          if (rel !== tag) relatedSet.add(rel)
        }
      }
    }

    const trends: TrendingItem[] = snapshot.trendingHashtags
      .map((entry, index) => {
        const normalizedTag = normalizeTag(entry.tag)
        const relatedTags = Array.from(itemByTag.get(normalizedTag) ?? []).slice(0, 5)
        const title = `#${normalizedTag}`

        return {
          id: `trend-${index}-${normalizedTag || 'unknown'}`,
          type: 'hashtag' as const,
          title,
          description: `Seen in ${entry.sources.length} research source${entry.sources.length === 1 ? '' : 's'}`,
          reach: Math.max(entry.count * 1000, 1000),
          momentum: toMomentum(entry.count),
          relatedHashtags: relatedTags.map((tag) => `#${tag}`),
          actionUrl: `/compose?topic=${encodeURIComponent(normalizedTag)}`,
          icon: '📈',
        }
      })
      .filter((item) => Boolean(normalizeTag(item.title)))

    const filtered =
      niche === 'general'
        ? trends
        : trends.filter((item) => {
            const haystack = `${item.title} ${item.description} ${item.relatedHashtags.join(' ')}`.toLowerCase()
            return haystack.includes(niche.toLowerCase())
          })

    const message =
      filtered.length > 0
        ? `Showing ${filtered.length} research-backed trends for ${niche} (${language})`
        : `No trend data available yet for ${niche}. Run research to populate trends.`

    return NextResponse.json(
      {
        success: true,
        data: {
          trends: filtered,
          refreshedAt: new Date().toISOString(),
          refreshIn: 4 * 60 * 60 * 1000, // 4 hours
          message,
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
