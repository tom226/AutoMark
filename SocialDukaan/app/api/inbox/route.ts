// app/api/inbox/route.ts - Unified Inbox Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { generateSmartReplies, analyzeSentiment } from '@/lib/ai-content'
import { InboxMessage, ApiResponse, SuggestedReply } from '@/lib/types'
import { loadTokens } from '@/lib/token-store'
import { getOnboardingProfile } from '@/lib/onboarding-store'
import { getUserIdFromRequest } from '@/lib/user-session'

interface InboxResponse {
  messages: InboxMessage[]
  unreadCount: number
  filter: string
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all' // all, unread, replied, starred
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    const tokens = await loadTokens(userId)
    const connectedPlatforms = [
      ...(tokens?.pages?.length ? ['facebook'] : []),
      ...(tokens?.instagramAccounts?.length ? ['instagram'] : []),
      ...(tokens?.linkedin?.accessToken ? ['linkedin'] : []),
      ...(tokens?.twitter?.accessToken ? ['twitter'] : []),
    ]

    const messages: InboxMessage[] = []

    // Filter messages
    let filtered = messages

    if (filter === 'unread') {
      filtered = filtered.filter((m) => m.status === 'UNREAD')
    } else if (filter === 'replied') {
      filtered = filtered.filter((m) => m.status === 'REPLIED')
    } else if (filter === 'starred') {
      filtered = filtered.filter((m) => m.status === 'STARRED')
    }

    if (platform) {
      filtered = filtered.filter((m) => m.platform === platform)
    }

    const result: InboxResponse = {
      messages: filtered.slice(0, limit),
      unreadCount: messages.filter((m) => m.status === 'UNREAD').length,
      filter,
    }

    const message =
      connectedPlatforms.length === 0
        ? 'Connect at least one social account to sync inbox messages.'
        : 'No synced inbox messages yet. Messaging sync will appear here once available.'

    return NextResponse.json(
      {
        success: true,
        data: result,
        message,
      } as ApiResponse<InboxResponse>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/inbox error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch inbox',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    const body = await request.json()
    const { messageId, action, messageText } = body

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: action',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    if (action !== 'suggest-replies' && !messageId) {
      return NextResponse.json(
        {
          success: false,
          error: 'messageId is required for this action',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    // Handle different actions
    if (action === 'suggest-replies') {
      if (!messageText || typeof messageText !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'messageText is required for suggest-replies',
          } as ApiResponse<null>,
          { status: 400 },
        )
      }

      // Get smart reply suggestions
      const sentiment = await analyzeSentiment(messageText)
      const profile = await getOnboardingProfile(userId)
      const replies = await generateSmartReplies(messageText, {
        platform: 'instagram',
        sentiment,
        niche: profile.niche || profile.businessType || 'general',
      })

      return NextResponse.json(
        {
          success: true,
          data: {
            messageId,
            suggestions: replies.map((text) => ({
              text,
              reasoning: 'AI-generated based on message context',
            })) as SuggestedReply[],
          },
          message: 'Generated 3 reply suggestions',
        } as ApiResponse<any>,
        { status: 200 },
      )
    }

    if (action === 'reply' || action === 'mark-read' || action === 'archive' || action === 'star') {
      return NextResponse.json(
        {
          success: false,
          error: `${action} is not available until inbox sync is connected for this account.`,
        } as ApiResponse<null>,
        { status: 501 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unknown action: ${action}`,
      } as ApiResponse<null>,
      { status: 400 },
    )
  } catch (error) {
    console.error('POST /api/inbox error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process inbox message',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
