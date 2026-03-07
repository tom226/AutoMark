// app/api/posts/schedule/route.ts - Post Scheduling Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { Post, ApiResponse } from '@/lib/types'
import { schedulePost, getBestPostingTime } from '@/lib/social-publisher'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { caption, hashtags, platforms, scheduledFor, mediaUrls, tone = 'casual' } = body

    // Validate required fields
    if (!caption || !platforms || platforms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: caption, platforms',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    const scheduledDate = scheduledFor ? new Date(scheduledFor) : new Date()

    // Create post object
    const post: Post = {
      id: `post_${Date.now()}`,
      userId: 'user_123', // Will come from session
      caption,
      hashtags: hashtags || [],
      mediaUrls: mediaUrls || [],
      status: 'SCHEDULED',
      platforms,
      scheduledFor: scheduledDate,
      tone,
      isAIGenerated: true,
      createdAt: new Date(),
    }

    // Schedule the post
    const result = await schedulePost(post, scheduledDate)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: post,
        message: `Post scheduled for ${scheduledDate.toISOString()}`,
      } as ApiResponse<Post>,
      { status: 201 },
    )
  } catch (error) {
    console.error('POST /api/posts/schedule error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule post',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')

    if (!platform) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: platform',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    const bestTime = getBestPostingTime(platform as any)

    return NextResponse.json(
      {
        success: true,
        data: {
          platform,
          bestTime: bestTime.toISOString(),
          message: `Best time to post on ${platform} is ${bestTime.toLocaleTimeString('en-IN')} IST`,
        },
      } as ApiResponse<any>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/posts/schedule error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get best time',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
