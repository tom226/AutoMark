import {
  getStoredEventResearch,
  saveEventResearch,
  type ResearchedRunningEvent,
} from "@/lib/event-research-store";

const MONTH_REGEX = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}/i;
const RUNNING_KEYWORD_REGEX = /(run|running|marathon|half\s*marathon|10k|5k|athon|stadium\s*run)/i;

function slugToTitle(url: string): string {
  const slug = url.split("/").filter(Boolean).pop() ?? "running-event";
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase())
    .replace(/\b(Delh|Ncr)\b/gi, (match) => match.toUpperCase());
}

function extractDateOrFallback(context: string): string {
  const match = context.match(MONTH_REGEX);
  return match ? match[0] : "Date to be confirmed";
}

function extractLocationOrFallback(context: string): string {
  const parts = context.split("|").map((item) => item.trim());
  const cityPart = parts.find((item) => /(delhi|gurugram|noida|ncr)/i.test(item));
  return cityPart || "Delhi NCR";
}

function dedupeEvents(events: ResearchedRunningEvent[]): ResearchedRunningEvent[] {
  const seen = new Set<string>();
  const out: ResearchedRunningEvent[] = [];

  for (const event of events) {
    const key = `${event.title.toLowerCase()}::${event.dateLabel.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(event);
  }

  return out;
}

async function fetchMarkdown(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "SocialDukaanBot/1.0 (+https://localhost)",
      Accept: "text/plain,text/markdown,text/html,*/*",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed fetching ${url}: ${response.status}`);
  }

  return response.text();
}

function parseLinksFromMarkdown(input: {
  markdown: string;
  source: string;
  topic: string;
  location: string;
}): ResearchedRunningEvent[] {
  const links = Array.from(
    input.markdown.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g)
  );

  const events: ResearchedRunningEvent[] = [];

  for (const [_, labelRaw, url] of links) {
    const label = labelRaw.replace(/\s+/g, " ").trim();
    const combined = `${label} ${url}`;
    if (!RUNNING_KEYWORD_REGEX.test(combined)) continue;

    if (!/(townscript\.com\/e\/|allevents\.in\/new-delhi\/)/i.test(url)) continue;

    const anchorIndex = input.markdown.indexOf(url);
    const context = input.markdown.slice(Math.max(0, anchorIndex - 120), Math.min(input.markdown.length, anchorIndex + 220));

    const title = label.length > 4 ? label : slugToTitle(url);
    if (!RUNNING_KEYWORD_REGEX.test(`${title} ${context}`)) continue;

    events.push({
      id: `${input.source}-${events.length + 1}-${Date.now()}`,
      title,
      dateLabel: extractDateOrFallback(context),
      location: extractLocationOrFallback(context) || input.location,
      source: input.source,
      sourceUrl: url,
      summary: `Matched for topic "${input.topic}" from ${input.source}`,
    });
  }

  return events;
}

async function fetchRelatedImageUrl(eventTitle: string): Promise<string | undefined> {
  const query = encodeURIComponent(`${eventTitle} running marathon`);
  const url = `https://api.openverse.engineering/v1/images/?q=${query}&page_size=1`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return undefined;

    const data = (await response.json()) as { results?: Array<{ url?: string; thumbnail?: string }> };
    const first = data.results?.[0];
    return first?.url || first?.thumbnail;
  } catch {
    return undefined;
  }
}

function scoreEvent(event: ResearchedRunningEvent, topic: string): number {
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const text = `${event.title} ${event.summary ?? ""} ${event.location}`.toLowerCase();
  let score = 0;

  for (const word of words) {
    if (text.includes(word)) score += 3;
  }
  if (/delhi|ncr|gurugram|noida/.test(text)) score += 2;
  if (/marathon|run|running|10k|5k/.test(text)) score += 3;

  return score;
}

export async function researchRunningEvents(input: {
  topic: string;
  location: string;
  minCount?: number;
}): Promise<ResearchedRunningEvent[]> {
  const minCount = Math.max(7, input.minCount ?? 7);

  const liveSources = [
    {
      url: "https://r.jina.ai/http://www.townscript.com/in/delhi/running",
      source: "townscript",
    },
    {
      url: "https://r.jina.ai/http://allevents.in/new-delhi/running",
      source: "allevents",
    },
  ];

  const collected: ResearchedRunningEvent[] = [];

  for (const source of liveSources) {
    try {
      const markdown = await fetchMarkdown(source.url);
      const parsed = parseLinksFromMarkdown({
        markdown,
        source: source.source,
        topic: input.topic,
        location: input.location,
      });
      collected.push(...parsed);
    } catch {
      // continue with other sources
    }
  }

  let events = dedupeEvents(collected)
    .sort((a, b) => scoreEvent(b, input.topic) - scoreEvent(a, input.topic))
    .slice(0, 20);

  if (events.length < minCount) {
    const stored = await getStoredEventResearch(input.topic, input.location);
    if (stored?.events?.length) {
      events = dedupeEvents([...events, ...stored.events]).slice(0, Math.max(minCount, 20));
    }
  }

  events = events.slice(0, Math.max(minCount, events.length));

  if (events.length > 0) {
    const enriched = await Promise.all(
      events.slice(0, 12).map(async (event) => ({
        ...event,
        imageUrl: event.imageUrl ?? (await fetchRelatedImageUrl(event.title)),
      }))
    );

    const finalEvents = enriched.slice(0, Math.max(minCount, 7));
    await saveEventResearch({
      topic: input.topic,
      location: input.location,
      events: finalEvents,
    });

    return finalEvents;
  }

  return [];
}
