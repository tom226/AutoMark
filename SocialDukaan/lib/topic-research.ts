import {
  getTopicResearch,
  saveTopicResearch,
  type TopicResearchInsight,
} from "@/lib/topic-research-store";

interface WikiSearchResponse {
  query?: {
    search?: Array<{
      title: string;
      snippet?: string;
    }>;
  };
}

interface WikiSummaryResponse {
  title?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
}

function normalizeTopic(topic: string): string {
  return topic.replace(/\s+/g, " ").trim();
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 30);
}

function uniqueInsights(items: TopicResearchInsight[]): TopicResearchInsight[] {
  const seen = new Set<string>();
  const out: TopicResearchInsight[] = [];
  for (const item of items) {
    const key = `${item.title.toLowerCase()}::${item.summary.slice(0, 80).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

async function fetchWikiSearch(topic: string): Promise<string[]> {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=&format=json&srlimit=8`;
  const response = await fetch(searchUrl, { cache: "no-store" });
  if (!response.ok) return [];

  const data = (await response.json()) as WikiSearchResponse;
  return (data.query?.search ?? []).map((item) => item.title).filter(Boolean);
}

async function fetchWikiSummary(title: string): Promise<WikiSummaryResponse | null> {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  try {
    const response = await fetch(summaryUrl, { cache: "no-store" });
    if (!response.ok) return null;
    return (await response.json()) as WikiSummaryResponse;
  } catch {
    return null;
  }
}

export async function researchTopicInsights(input: {
  topic: string;
  location?: string;
  minCount?: number;
}): Promise<TopicResearchInsight[]> {
  const topic = normalizeTopic(input.topic);
  const minCount = Math.max(7, input.minCount ?? 7);

  const cached = await getTopicResearch(topic, input.location);
  const freshEnough =
    cached &&
    Date.now() - new Date(cached.updatedAt).getTime() < 24 * 60 * 60 * 1000 &&
    cached.insights.length >= minCount;

  if (freshEnough) return cached.insights.slice(0, minCount);

  const titles = await fetchWikiSearch(`${topic} ${input.location ?? ""}`.trim());
  const insights: TopicResearchInsight[] = [];

  for (const title of titles.slice(0, 7)) {
    const summary = await fetchWikiSummary(title);
    if (!summary?.extract) continue;

    const sentences = splitSentences(summary.extract);
    if (sentences.length === 0) continue;

    insights.push({
      id: `insight-${Date.now()}-${insights.length}`,
      title: summary.title ?? title,
      summary: sentences[0].slice(0, 260),
      sourceUrl: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s+/g, "_"))}`,
    });
  }

  const deduped = uniqueInsights(insights).slice(0, Math.max(minCount, 10));

  if (deduped.length > 0) {
    await saveTopicResearch({
      topic,
      location: input.location,
      insights: deduped,
    });
  }

  if (deduped.length >= minCount) {
    return deduped.slice(0, minCount);
  }

  const fallback = cached?.insights ?? [];
  return [...deduped, ...fallback].slice(0, Math.max(minCount, deduped.length));
}
