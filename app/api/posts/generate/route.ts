// app/api/posts/generate/route.ts - AI Post Generator Endpoint

import { NextRequest, NextResponse } from 'next/server'
import { generateAIContent, generateContentVariants } from '@/lib/ai-content'
import { AIContentRequest, ApiResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body: AIContentRequest = await request.json()

    // Validate required fields
    if (!body.niche) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: niche',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    const keyword = body.keyword || body.topic || 'general'

    // Generate AI content variants
    const response = await generateAIContent({
      ...body,
      keyword,
    })

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Content generated successfully',
      } as ApiResponse<typeof response>,
      { status: 200 },
    )
  } catch (error) {
    console.error('POST /api/posts/generate error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Monthly calendar generation
    const searchParams = request.nextUrl.searchParams
    const niche = searchParams.get('niche')
    const days = parseInt(searchParams.get('days') || '28', 10)
    const language = (searchParams.get('language') as 'en' | 'hi') || 'en'

    if (!niche) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: niche',
        } as ApiResponse<null>,
        { status: 400 },
      )
    }

    const { generateMonthlyContentCalendar } = await import('@/lib/ai-content')
    const captions = await generateMonthlyContentCalendar(niche, days, language)

    return NextResponse.json(
      {
        success: true,
        data: captions,
        message: `Generated ${captions.length} content ideas`,
      } as ApiResponse<string[]>,
      { status: 200 },
    )
  } catch (error) {
    console.error('GET /api/posts/generate error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate calendar',
      } as ApiResponse<null>,
      { status: 500 },
    )
  }
}
