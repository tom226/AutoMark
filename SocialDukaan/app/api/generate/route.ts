import { NextResponse } from "next/server";
import { buildFestivalCaptionTemplate, INDIA_EVENTS_2026, type IndiaLanguage } from "@/lib/india-festivals";

interface GeneratePayload {
  topic?: string;
  tone?: string;
  channel?: "instagram" | "facebook" | "linkedin" | "whatsapp";
  language?: IndiaLanguage;
  eventId?: string;
  niche?: string;
  inspirations?: string[];
}

const channelMap = {
  instagram: ["#InstaBusiness", "#BrandStory", "#DailyContent"],
  facebook: ["#CommunityFirst", "#BusinessUpdate", "#LocalGrowth"],
  linkedin: ["#ProfessionalBrand", "#Leadership", "#GrowthStrategy"],
  whatsapp: ["#WhatsAppBusiness", "#CustomerConnect", "#LocalGrowth"],
} as const;

const languageLine: Record<IndiaLanguage, string> = {
  english: "Write in clear English.",
  hindi: "Hindi mein likho, simple aur clear tone mein.",
  hinglish: "Natural Hinglish mein likho (Hindi + English mix).",
  marathi: "Marathi madhye lihha, sthanik tone theva.",
  tamil: "Tamil mozhi style-il ezhuthunga, local vibe maintain pannunga.",
  bengali: "Bangla te likhun, warm local tone rakhun.",
  gujarati: "Gujarati ma lakho, business-friendly local tone sathe.",
};

function parseLanguage(input: string | undefined): IndiaLanguage {
  const normalized = (input || "english").toLowerCase();
  if (
    normalized === "hindi" ||
    normalized === "hinglish" ||
    normalized === "marathi" ||
    normalized === "tamil" ||
    normalized === "bengali" ||
    normalized === "gujarati"
  ) {
    return normalized;
  }
  return "english";
}

export async function POST(request: Request) {
  const body = (await request.json()) as GeneratePayload;

  if (!body.topic || !body.channel) {
    return NextResponse.json({ error: "topic and channel are required" }, { status: 400 });
  }

  const tone = body.tone ?? "Engaging";
  const language = parseLanguage(body.language);
  const event = body.eventId ? INDIA_EVENTS_2026.find((item) => item.id === body.eventId) : undefined;
  const inspirationLine =
    body.inspirations && body.inspirations.length > 0
      ? ` Inspired by: ${body.inspirations.slice(0, 2).join(" | ")}.`
      : "";

  const festivalLine = event
    ? ` ${buildFestivalCaptionTemplate({
        event,
        niche: body.niche,
        language,
      })}`
    : "";

  const caption = `${tone} update: ${body.topic}.${inspirationLine}${festivalLine} ${languageLine[language]} Crafted for your ${body.channel} audience with clear value and a strong call to action.`;

  return NextResponse.json({
    caption,
    language,
    hashtags: channelMap[body.channel],
    suggestedTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
  });
}
