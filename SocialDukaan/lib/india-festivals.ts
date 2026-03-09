export type IndiaLanguage =
  | "english"
  | "hindi"
  | "hinglish"
  | "marathi"
  | "tamil"
  | "bengali"
  | "gujarati";

export interface IndiaFestivalEvent {
  id: string;
  name: string;
  date: string;
  region: "india" | "north" | "south" | "west" | "east";
  tags: string[];
  type: "festival" | "sports" | "campaign";
}

export const INDIA_EVENTS_2026: IndiaFestivalEvent[] = [
  { id: "makar-sankranti", name: "Makar Sankranti", date: "2026-01-14", region: "india", tags: ["festival", "harvest"], type: "festival" },
  { id: "pongal", name: "Pongal", date: "2026-01-14", region: "south", tags: ["festival", "harvest", "tamil"], type: "festival" },
  { id: "republic-day", name: "Republic Day", date: "2026-01-26", region: "india", tags: ["national", "india"], type: "campaign" },
  { id: "maha-shivratri", name: "Maha Shivratri", date: "2026-02-15", region: "india", tags: ["festival", "devotional"], type: "festival" },
  { id: "ipl-season", name: "IPL Season Kickoff", date: "2026-03-22", region: "india", tags: ["ipl", "cricket", "sports"], type: "sports" },
  { id: "holi", name: "Holi", date: "2026-03-04", region: "india", tags: ["festival", "colors"], type: "festival" },
  { id: "eid-al-fitr", name: "Eid al-Fitr", date: "2026-03-21", region: "india", tags: ["festival", "eid"], type: "festival" },
  { id: "gudi-padwa", name: "Gudi Padwa", date: "2026-03-20", region: "west", tags: ["festival", "marathi"], type: "festival" },
  { id: "ram-navami", name: "Ram Navami", date: "2026-03-26", region: "india", tags: ["festival", "devotional"], type: "festival" },
  { id: "baisakhi", name: "Baisakhi", date: "2026-04-13", region: "north", tags: ["festival", "harvest"], type: "festival" },
  { id: "raksha-bandhan", name: "Raksha Bandhan", date: "2026-08-09", region: "india", tags: ["festival", "family"], type: "festival" },
  { id: "independence-day", name: "Independence Day", date: "2026-08-15", region: "india", tags: ["national", "india"], type: "campaign" },
  { id: "ganesh-chaturthi", name: "Ganesh Chaturthi", date: "2026-09-02", region: "west", tags: ["festival", "maharashtra"], type: "festival" },
  { id: "navratri", name: "Navratri", date: "2026-10-02", region: "west", tags: ["festival", "garba"], type: "festival" },
  { id: "dussehra", name: "Dussehra", date: "2026-10-12", region: "india", tags: ["festival", "victory"], type: "festival" },
  { id: "diwali", name: "Diwali", date: "2026-10-29", region: "india", tags: ["festival", "lights", "shopping"], type: "festival" },
  { id: "chhath-puja", name: "Chhath Puja", date: "2026-11-07", region: "north", tags: ["festival", "bihar"], type: "festival" },
  { id: "christmas", name: "Christmas", date: "2026-12-25", region: "india", tags: ["festival", "seasonal"], type: "festival" },
];

const languagePrefix: Record<IndiaLanguage, string> = {
  english: "Celebrate",
  hindi: "Shubh avsar par",
  hinglish: "Iss festive moment par",
  marathi: "Ya sanacha nimitta",
  tamil: "Intha vizha nerathil",
  bengali: "Ei utsober somoye",
  gujarati: "Aa parv par",
};

export function listUpcomingIndiaEvents(fromDate: Date, daysAhead = 45): IndiaFestivalEvent[] {
  const start = +new Date(fromDate.toISOString().slice(0, 10));
  const end = start + daysAhead * 24 * 60 * 60 * 1000;

  return INDIA_EVENTS_2026
    .filter((item) => {
      const d = +new Date(item.date);
      return d >= start && d <= end;
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export function buildFestivalCaptionTemplate(input: {
  event: IndiaFestivalEvent;
  businessName?: string;
  niche?: string;
  language: IndiaLanguage;
}): string {
  const prefix = languagePrefix[input.language];
  const businessLine = input.businessName ? ` from ${input.businessName}` : "";
  const nicheLine = input.niche ? ` for ${input.niche} audience` : "";

  return `${prefix} ${input.event.name}${businessLine}${nicheLine}. Offer value, festive emotion, and one clear CTA for local customers.`;
}
