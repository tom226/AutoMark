// lib/ai-content.ts - AutoMark AI Content Generation Service

import { AIContentRequest, AIContentResponse, PostVariant, PostTone } from './types'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Hindi content generation prompts
const HINDI_SYSTEM_PROMPT = `You are AutoMark, an AI content creator for Indian social media. Generate captions in Hinglish (Hindi-English mix) that resonates with Indian audiences. 

Guidelines:
- Use Hinglish naturally (mix Hindi and English words)
- Add relevant emojis
- Keep tone friendly and relatable
- Include cultural references when appropriate
- Use Indian idioms where fitting
- Make content shareable and engaging`

const ENGLISH_SYSTEM_PROMPT = `You are AutoMark, an AI content creator for social media. Generate professional, engaging captions that drive engagement.

Guidelines:
- Write in clear, conversational English
- Add relevant emojis
- Keep tone consistent with the requested style
- Include calls-to-action
- Optimize for each platform's best practices`

/**
 * Generate AI content variants for multiple social media platforms
 */
export async function generateAIContent(
  request: AIContentRequest,
): Promise<AIContentResponse> {
  const {
    keyword,
    topic,
    niche,
    tone = 'casual',
    language = 'en',
    hashtag = true,
    emoji = true,
  } = request

  const contentPrompt = generatePrompt(
    keyword || topic || 'general content',
    niche,
    tone,
    language,
    hashtag,
    emoji,
  )

  try {
    const response = await callOpenAI(contentPrompt, language)
    return parseAIResponse(response, tone)
  } catch (error) {
    console.error('AI content generation error:', error)
    throw new Error('Failed to generate content')
  }
}

/**
 * Generate 3 content variants with different tones for the same topic
 */
export async function generateContentVariants(
  topic: string,
  niche: string,
  language: 'en' | 'hi' = 'en',
): Promise<PostVariant[]> {
  const tones: PostTone[] = ['professional', 'casual', 'funny']
  const variants: PostVariant[] = []

  for (const tone of tones) {
    const response = await generateAIContent({
      topic,
      niche,
      tone,
      language,
      hashtag: true,
    })

    if (response.variants.length > 0) {
      variants.push(response.variants[0])
    }
  }

  return variants
}

/**
 * Switch tone of existing caption
 */
export async function switchCaptionTone(
  caption: string,
  newTone: PostTone,
  language: 'en' | 'hi' = 'en',
): Promise<string> {
  const systemPrompt =
    language === 'hi' ? HINDI_SYSTEM_PROMPT : ENGLISH_SYSTEM_PROMPT

  const userPrompt = `
Rewrite this caption in a ${newTone} tone:

Original: ${caption}

Keep the core message but change the tone. ${language === 'hi' ? 'Write in Hinglish.' : 'Write in English.'}`

  const response = await callOpenAI(userPrompt, language, systemPrompt)
  return response.trim()
}

/**
 * Generate hashtag recommendations
 */
export async function generateHashtags(
  caption: string,
  niche: string,
  count: number = 10,
): Promise<string[]> {
  const userPrompt = `
Generate ${count} relevant hashtags for this ${niche} social media post:

"${caption}"

Return ONLY hashtags (with # symbol), one per line. No explanations.`

  const response = await callOpenAI(userPrompt, 'en')
  const hashtags = response
    .split('\n')
    .filter((tag) => tag.startsWith('#'))
    .map((tag) => tag.trim())
    .slice(0, count)

  return hashtags
}

/**
 * Generate captions for monthly content calendar
 */
export async function generateMonthlyContentCalendar(
  niche: string,
  daysInMonth: number = 28,
  language: 'en' | 'hi' = 'en',
): Promise<string[]> {
  const systemPrompt =
    language === 'hi' ? HINDI_SYSTEM_PROMPT : ENGLISH_SYSTEM_PROMPT

  const userPrompt = `
Generate ${daysInMonth} unique social media captions for a ${niche} business for one month.
Include content ideas, post types, and engagement hooks.
${language === 'hi' ? 'Write in Hinglish.' : 'Write in English.'}

Return as numbered list (1-${daysInMonth}), one caption per line.`

  const response = await callOpenAI(userPrompt, language, systemPrompt)
  const captions = response
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, daysInMonth)

  return captions
}

/**
 * Generate smart replies to comments/DMs
 */
export async function generateSmartReplies(
  incomingMessage: string,
  context: { platform: string; sentiment: string; niche: string },
  language: 'en' | 'hi' = 'en',
): Promise<string[]> {
  const systemPrompt = `You are AutoMark, helping generate quick replies to ${context.platform} messages for a ${context.niche} business. 
Generate 3 short, friendly, contextually appropriate replies.
${language === 'hi' ? 'Write in Hinglish.' : 'Write in English.'}
The incoming message sentiment is: ${context.sentiment}`

  const userPrompt = `
Incoming message: "${incomingMessage}"

Generate 3 quick reply suggestions (keep each under 150 characters).
Return only the 3 replies, numbered 1-3, one per line.`

  const response = await callOpenAI(userPrompt, language, systemPrompt)
  const replies = response
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .slice(0, 3)

  return replies
}

/**
 * Analyze sentiment of a message
 */
export async function analyzeSentiment(
  text: string,
): Promise<'positive' | 'negative' | 'neutral'> {
  const userPrompt = `
Analyze the sentiment of this message and respond with ONLY one word: positive, negative, or neutral.

Message: "${text}"`

  const response = await callOpenAI(userPrompt, 'en')
  const sentiment = response.toLowerCase().trim()

  if (sentiment.includes('positive')) return 'positive'
  if (sentiment.includes('negative')) return 'negative'
  return 'neutral'
}

/**
 * Generate platform-specific captions from a generic one
 */
export async function adaptCaptionForPlatform(
  caption: string,
  platform: 'instagram' | 'twitter' | 'linkedin' | 'facebook' | 'youtube',
  language: 'en' | 'hi' = 'en',
): Promise<string> {
  const platformLimits = {
    instagram: 2200,
    twitter: 280,
    linkedin: 3000,
    facebook: 63206,
    youtube: 5000,
  }

  const systemPrompt = `You are AutoMark. Adapt captions for different social platforms.
${language === 'hi' ? 'Write in Hinglish.' : 'Write in English.'}`

  const userPrompt = `
Adapt this caption for ${platform} (max ${platformLimits[platform]} characters):

Original: ${caption}

Keep the main message but optimize for ${platform}'s format and audience.`

  const response = await callOpenAI(userPrompt, language, systemPrompt)
  return response.trim().slice(0, platformLimits[platform])
}

// ============================================
// Private Helper Functions
// ============================================

function generatePrompt(
  topic: string,
  niche: string,
  tone: PostTone,
  language: 'en' | 'hi',
  includeHashtags: boolean,
  includeEmojis: boolean,
): string {
  const basePrompt = `Generate 3 unique, engaging social media captions for "${topic}" for a ${niche} business.

Tone: ${tone}
${includeEmojis ? 'Include relevant emojis.' : 'Do not use emojis.'}
${includeHashtags ? 'Include 5-10 relevant hashtags.' : 'Do not include hashtags.'}
${language === 'hi' ? 'Write in Hinglish (mix of Hindi and English).' : 'Write in English.'}

Format your response as:
---VARIANT 1---
Caption: [caption text]
Hashtags: [hashtags if applicable]

---VARIANT 2---
Caption: [caption text]
Hashtags: [hashtags if applicable]

---VARIANT 3---
Caption: [caption text]
Hashtags: [hashtags if applicable]`

  return basePrompt
}

async function callOpenAI(
  userMessage: string,
  language: 'en' | 'hi' = 'en',
  customSystemPrompt?: string,
): Promise<string> {
  const systemPrompt =
    customSystemPrompt ||
    (language === 'hi' ? HINDI_SYSTEM_PROMPT : ENGLISH_SYSTEM_PROMPT)

  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: userMessage,
    },
  ]

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI response structure')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenAI API call failed:', error)
    throw error
  }
}

function parseAIResponse(
  responseText: string,
  tone: PostTone,
): AIContentResponse {
  const variants: PostVariant[] = []
  const suggestions: string[] = []

  // Split by variant markers
  const variantMatches = responseText.match(
    /---VARIANT\s+\d+---([\s\S]*?)(?=---VARIANT|\n?$)/g,
  )

  if (variantMatches) {
    variantMatches.forEach((match) => {
      const captionMatch = match.match(/Caption:\s*([\s\S]*?)(?=\nHashtags|$)/)
      const hashtagMatch = match.match(/Hashtags:\s*([\s\S]*?)$/m)

      if (captionMatch) {
        const caption = captionMatch[1].trim()
        const hashtags = hashtagMatch
          ? hashtagMatch[1]
              .split(/[\s,]+/)
              .filter((tag) => tag.startsWith('#'))
              .map((tag) => tag.trim())
          : []

        variants.push({
          caption,
          tone,
          hashtags,
        })
      }
    })
  }

  // If parsing fails, try a simpler split
  if (variants.length === 0) {
    const paragraphs = responseText.split('\n\n').filter((p) => p.trim())
    paragraphs.slice(0, 3).forEach((paragraph) => {
      variants.push({
        caption: paragraph.trim(),
        tone,
        hashtags: [],
      })
    })
  }

  return {
    variants: variants.slice(0, 3),
    suggestions,
  }
}

/**
 * Generate a trending content idea for today
 */
export async function generateTrendingIdea(
  niche: string,
  language: 'en' | 'hi' = 'en',
): Promise<string> {
  const systemPrompt = `You are AutoMark, generating trending content ideas for ${niche} businesses in India.
${language === 'hi' ? 'Write in Hinglish.' : 'Write in English.'}`

  const userPrompt = `Generate one trending, actionable content idea for a ${niche} business today.
Include a hook, main idea, and suggested hashtags.
Keep it under 100 words.`

  const response = await callOpenAI(userPrompt, language, systemPrompt)
  return response.trim()
}

/**
 * Create a brandvoice onboarding prompt
 */
export async function initializeBrandVoice(
  niche: string,
  description: string,
): Promise<string> {
  const userPrompt = `
Analyze this brand description and suggest a consistent voice/tone for ${niche}:

"${description}"

Provide:
1. Recommended tone(s)
2. Key voice characteristics
3. What to avoid
4. Example caption in that voice`

  const response = await callOpenAI(userPrompt, 'en')
  return response.trim()
}
