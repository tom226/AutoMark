import { listCompetitors } from "@/lib/competitor-store";

function toneLine(tone?: string): string {
  const styles: Record<string, string> = {
    professional: "Actionable strategy with clear outcomes",
    casual: "Simple practical tip you can apply today",
    witty: "A sharp one-liner with useful value",
    inspirational: "A motivating message with a concrete next step",
  };
  return styles[tone ?? ""] ?? "Actionable strategy with clear outcomes";
}

function deriveTopicFromCompetitor(input?: { handle: string; topHashtags: string[] }): string {
  if (!input) return "your niche audience";

  const hashtagTopic = input.topHashtags.find((tag) => !["#marketing", "#socialmedia", "#growth", "#content"].includes(tag.toLowerCase()));
  if (hashtagTopic) {
    return hashtagTopic.replace(/^#/, "").replace(/[_-]/g, " ");
  }

  const handleTopic = input.handle.replace(/^@/, "").replace(/[._-]/g, " ").trim();
  return handleTopic || "your niche audience";
}

export async function buildAutopilotCaptionFromContext(input: {
  channel: "instagram" | "facebook";
  tone?: string;
  campaignTopic?: string;
  competitorHint?: string;
}): Promise<string> {
  const competitors = await listCompetitors();
  const primaryCompetitor = competitors.find((item) => !item.isSeed) ?? competitors[0];

  const topic = input.campaignTopic?.trim() || deriveTopicFromCompetitor(primaryCompetitor);
  const competitorLabel = input.competitorHint?.trim() || primaryCompetitor?.handle || "a leading competitor";
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return `${toneLine(input.tone)}: ${topic}.\n\nInspired by recent momentum from ${competitorLabel}, this ${input.channel} update focuses on clear value and one direct CTA.\n\nBuilt by Autopilot • ${today}\n#socialmedia #marketing #growth`;
}
