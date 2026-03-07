// app/api/inbox/route.ts - Unified Inbox Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { generateSmartReplies, analyzeSentiment } from '@/lib/ai-content'
import { InboxMessage, ApiResponse, SuggestedReply } from '@/lib/types'

interface InboxResponse {
  messages: InboxMessage[]
  unreadCount: number
  filter: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filter = searchParams.get('filter') || 'all' // all, unread, replied, starred
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Mock inbox data
    const mockMessages: InboxMessage[] = [
      {
        id: 'msg_1',
        platform: 'instagram',
        senderName: 'Priya Sharma',
        senderHandle: '@priya_designs',
        messageText: 'This design is amazing! Where can I buy?',
        sentiment: 'positive',
        status: 'UNREAD',
        receivedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      },
      {
        id: 'msg_2',
        platform: 'facebook',
        senderName: 'Raj Patel',
        senderHandle: 'raj.patel',
        messageText: 'What are your delivery timings?',
        sentiment: 'neutral',
        status: 'UNREAD',
        receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'msg_3',
        platform: 'instagram',
        senderName: 'Customer Support',
        senderHandle: '@customer_care',
        messageText: 'Is this product still in stock?',
        sentiment: 'neutral',
        status: 'READ',
        receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
    ]

    // Filter messages
    let filtered = mockMessages

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
      unreadCount: mockMessages.filter((m) => m.status === 'UNREAD').length,
      filter,
    }

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Showing ${result.messages.length} messages`,
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
    const body = await request.json()
    const { messageId, action, messageText } = body

    if (!messageId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: messageId, action',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    // Handle different actions
    if (action === 'reply') {
      // In real app, would send reply via platform API
      return NextResponse.json(
        {
          success: true,
          data: { messageId, status: 'REPLIED', repliedAt: new Date() },
          message: 'Reply sent successfully',
        } as ApiResponse<any>,
        { status: 200 },
      )
    } else if (action === 'suggest-replies') {
      // Get smart reply suggestions
      const sentiment = await analyzeSentiment(messageText)
      const replies = await generateSmartReplies(messageText, {
        platform: 'instagram',
        sentiment,
        niche: 'restaurant', // Would come from user data
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
    } else if (action === 'mark-read') {
      return NextResponse.json(
        {
          success: true,
          data: { messageId, status: 'READ' },
          message: 'Message marked as read',
        } as ApiResponse<any>,
        { status: 200 },
      )
    } else if (action === 'archive') {
      return NextResponse.json(
        {
          success: true,
          data: { messageId, status: 'ARCHIVED' },
          message: 'Message archived',
        } as ApiResponse<any>,
        { status: 200 },
      )
    } else if (action === 'star') {
      return NextResponse.json(
        {
          success: true,
          data: { messageId, status: 'STARRED' },
          message: 'Message starred',
        } as ApiResponse<any>,
        { status: 200 },
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
