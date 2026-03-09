import { NextResponse } from "next/server";
import {
  getAllIndiaEvents,
  buildFestivalAIPrompt,
  buildFestivalCaptionTemplate,
  type IndiaLanguage,
} from "@/lib/india-festivals";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

interface GeneratePayload {
  topic?: string;
  tone?: string;
  channel?: "instagram" | "facebook" | "linkedin" | "whatsapp";
  language?: IndiaLanguage;
  eventId?: string;
  niche?: string;
  inspirations?: string[];
}

const channelMap: Record<string, string[]> = {
  instagram: ["#InstaBusiness", "#BrandStory", "#DailyContent"],
  facebook: ["#CommunityFirst", "#BusinessUpdate", "#LocalGrowth"],
  linkedin: ["#ProfessionalBrand", "#Leadership", "#GrowthStrategy"],
  whatsapp: ["#WhatsAppBusiness", "#CustomerConnect", "#LocalGrowth"],
};

const languageInstruction: Record<IndiaLanguage, string> = {
  english: "Write in clear English.",
  hindi: "Hindi mein likho, simple aur clear tone mein. Use Devanagari script.",
  hinglish: "Natural Hinglish mein likho (Hindi + English mix, Roman script). This is how young Indians actually talk on social media.",
  marathi: "Marathi madhye lihha, sthanik tone theva. Use Devanagari script.",
  tamil: "Tamil mozhi style-il ezhuthunga, local vibe maintain pannunga. Use Tamil script.",
  bengali: "Bangla te likhun, warm local tone rakhun. Use Bengali script.",
  gujarati: "Gujarati ma lakho, business-friendly local tone sathe. Use Gujarati script.",
  telugu: "Telugu lo raayandi, local feel maintain cheyandi. Use Telugu script.",
  kannada: "Kannada dalli bari, local tone itkollri. Use Kannada script.",
  malayalam: "Malayalam-il ezhuthuka, local tone maintain cheyyuka. Use Malayalam script.",
  punjabi: "Punjabi vich likho, desi vibe naal. Use Gurmukhi script.",
};

function parseLanguage(input: string | undefined): IndiaLanguage {
  const normalized = (input || "english").toLowerCase();
  if (normalized in languageInstruction) {
    return normalized as IndiaLanguage;
  }
  return "english";
}

async function callOpenAIForCaption(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as GeneratePayload;

  if (!body.topic || !body.channel) {
    return NextResponse.json({ error: "topic and channel are required" }, { status: 400 });
  }

  const tone = body.tone ?? "Engaging";
  const language = parseLanguage(body.language);
  const allEvents = getAllIndiaEvents();
  const event = body.eventId ? allEvents.find((item) => item.id === body.eventId) : undefined;

  // If OpenAI key is configured, use real AI generation
  if (OPENAI_API_KEY) {
    try {
      const systemPrompt = [
        "You are SocialDukaan AI — India's smartest social media caption writer.",
        "You write viral, culturally-aware posts for Indian small businesses.",
        `${languageInstruction[language]}`,
        `Tone: ${tone}.`,
        `Platform: ${body.channel}.`,
        "Always include relevant emojis and a strong call-to-action.",
        "Return the caption first, then hashtags on a new line starting with 'Hashtags:'.",
      ].join("\n");

      let userPrompt: string;
      if (event) {
        userPrompt = buildFestivalAIPrompt({
          event,
          businessName: undefined,
          niche: body.niche,
          language,
          tone,
          channel: body.channel,
        });
      } else {
        const inspirationLine =
          body.inspirations && body.inspirations.length > 0
            ? `\nInspiration/reference: ${body.inspirations.slice(0, 2).join(" | ")}.`
            : "";
        userPrompt = [
          `Write a ${tone.toLowerCase()} ${body.channel} caption about: ${body.topic}.`,
          body.niche ? `Business niche: ${body.niche}.` : "",
          inspirationLine,
          languageInstruction[language],
          "Include 5-8 relevant hashtags at the end.",
        ].filter(Boolean).join("\n");
      }

      const aiResponse = await callOpenAIForCaption(systemPrompt, userPrompt);

      // Parse hashtags from AI response
      const hashtagLine = aiResponse.match(/Hashtags?:\s*(.+)/i);
      let caption = aiResponse;
      let hashtags = channelMap[body.channel] || [];

      if (hashtagLine) {
        caption = aiResponse.slice(0, hashtagLine.index).trim();
        const parsed = hashtagLine[1].match(/#\w+/g);
        if (parsed && parsed.length > 0) {
          hashtags = parsed;
        }
      } else {
        // Try extracting inline hashtags
        const inlineHashtags = aiResponse.match(/#\w+/g);
        if (inlineHashtags && inlineHashtags.length >= 3) {
          hashtags = inlineHashtags;
        }
      }

      return NextResponse.json({
        caption,
        language,
        hashtags,
        aiGenerated: true,
        festival: event ? { id: event.id, name: event.name } : undefined,
        suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      });
    } catch (error) {
      console.error("OpenAI generation failed, falling back to template:", error);
      // Fall through to template-based generation below
    }
  }

  // Template-based fallback when OPENAI_API_KEY is not set or API fails
  const inspirationLine =
    body.inspirations && body.inspirations.length > 0
      ? ` Inspired by: ${body.inspirations.slice(0, 2).join(" | ")}.`
      : "";

  const festivalLine = event
    ? ` ${buildFestivalCaptionTemplate({ event, niche: body.niche, language })}`
    : "";

  const caption = `${tone} update: ${body.topic}.${inspirationLine}${festivalLine} ${languageInstruction[language]} Crafted for your ${body.channel} audience with clear value and a strong call to action.`;

  return NextResponse.json({
    caption,
    language,
    hashtags: channelMap[body.channel] || [],
    aiGenerated: false,
    festival: event ? { id: event.id, name: event.name } : undefined,
    suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });
}
