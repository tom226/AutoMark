export type IndiaLanguage =
  | "english"
  | "hindi"
  | "hinglish"
  | "marathi"
  | "tamil"
  | "bengali"
  | "gujarati"
  | "telugu"
  | "kannada"
  | "malayalam"
  | "punjabi";

export interface IndiaFestivalEvent {
  id: string;
  name: string;
  date: string;
  region: "india" | "north" | "south" | "west" | "east" | "northeast";
  tags: string[];
  type: "festival" | "sports" | "campaign" | "shopping";
  description?: string;
  postIdeas?: string[];
}

/* ── Recurring festival templates with approximate month-day offsets ──
   Lunar/Islamic dates shift each year; these are best-known approximations
   for 2025-2027. For production accuracy, consider an external API. */

const INDIA_EVENTS_BY_YEAR: Record<number, IndiaFestivalEvent[]> = {
  2025: [
    { id: "makar-sankranti-2025", name: "Makar Sankranti", date: "2025-01-14", region: "india", tags: ["festival", "harvest"], type: "festival", description: "Harvest festival celebrated across India", postIdeas: ["Special festive offer", "Til-gul greetings post", "Kite festival photos"] },
    { id: "pongal-2025", name: "Pongal", date: "2025-01-15", region: "south", tags: ["festival", "harvest", "tamil"], type: "festival", description: "Tamil harvest festival", postIdeas: ["Traditional Pongal pot photo", "Sweet Pongal recipe reel"] },
    { id: "republic-day-2025", name: "Republic Day", date: "2025-01-26", region: "india", tags: ["national", "india"], type: "campaign", description: "India Republic Day", postIdeas: ["Tricolour-themed post", "Patriotic offer/sale", "Team tribute reel"] },
    { id: "basant-panchami-2025", name: "Basant Panchami", date: "2025-02-02", region: "india", tags: ["festival", "spring", "saraswati"], type: "festival", description: "Saraswati Puja / Spring festival", postIdeas: ["Yellow themed post", "Education/learning offer"] },
    { id: "maha-shivratri-2025", name: "Maha Shivratri", date: "2025-02-26", region: "india", tags: ["festival", "devotional"], type: "festival", description: "Night of Lord Shiva", postIdeas: ["Spiritual greetings post", "Night event promo"] },
    { id: "holi-2025", name: "Holi", date: "2025-03-14", region: "india", tags: ["festival", "colors"], type: "festival", description: "Festival of colours", postIdeas: ["Colour splash reel", "Holi sale campaign", "Before/after brand colours post"] },
    { id: "eid-al-fitr-2025", name: "Eid al-Fitr", date: "2025-03-31", region: "india", tags: ["festival", "eid"], type: "festival", description: "End of Ramadan", postIdeas: ["Eid Mubarak greetings", "Special Eid offer"] },
    { id: "gudi-padwa-2025", name: "Gudi Padwa / Ugadi", date: "2025-03-30", region: "west", tags: ["festival", "marathi", "new-year"], type: "festival", description: "Marathi/Telugu New Year", postIdeas: ["New year offer launch", "Traditional rangoli photo"] },
    { id: "baisakhi-2025", name: "Baisakhi", date: "2025-04-13", region: "north", tags: ["festival", "harvest", "punjabi"], type: "festival", description: "Punjabi harvest festival", postIdeas: ["Bhangra reel", "Harvest sale post"] },
    { id: "ram-navami-2025", name: "Ram Navami", date: "2025-04-06", region: "india", tags: ["festival", "devotional"], type: "festival" },
    { id: "akshaya-tritiya-2025", name: "Akshaya Tritiya", date: "2025-04-30", region: "india", tags: ["festival", "gold", "shopping"], type: "shopping", description: "Auspicious buying day", postIdeas: ["Gold/jewellery offer", "Investment tips post", "New product launch"] },
    { id: "eid-al-adha-2025", name: "Eid al-Adha (Bakrid)", date: "2025-06-07", region: "india", tags: ["festival", "eid"], type: "festival" },
    { id: "rath-yatra-2025", name: "Rath Yatra", date: "2025-06-27", region: "east", tags: ["festival", "puri", "odisha"], type: "festival", description: "Jagannath Rath Yatra" },
    { id: "guru-purnima-2025", name: "Guru Purnima", date: "2025-07-10", region: "india", tags: ["festival", "guru", "teacher"], type: "festival", postIdeas: ["Thank your mentor post", "Education offer"] },
    { id: "raksha-bandhan-2025", name: "Raksha Bandhan", date: "2025-08-09", region: "india", tags: ["festival", "family", "sibling"], type: "festival", postIdeas: ["Sibling discount code", "Gift hamper promo", "Rakhi delivery offer"] },
    { id: "independence-day-2025", name: "Independence Day", date: "2025-08-15", region: "india", tags: ["national", "india"], type: "campaign", postIdeas: ["Freedom sale", "Tricolour-themed content"] },
    { id: "janmashtami-2025", name: "Janmashtami", date: "2025-08-16", region: "india", tags: ["festival", "devotional", "krishna"], type: "festival", postIdeas: ["Dahi handi reel", "Midnight celebration post"] },
    { id: "onam-2025", name: "Onam", date: "2025-09-05", region: "south", tags: ["festival", "kerala", "malayalam"], type: "festival", description: "Kerala harvest festival", postIdeas: ["Onam sadhya photo", "Pookalam rangoli contest", "Kerala themed offer"] },
    { id: "ganesh-chaturthi-2025", name: "Ganesh Chaturthi", date: "2025-08-27", region: "west", tags: ["festival", "maharashtra", "ganpati"], type: "festival", postIdeas: ["Ganpati Bappa morya reel", "Eco-friendly celebration post", "Modak recipe content"] },
    { id: "navratri-2025", name: "Navratri", date: "2025-10-02", region: "india", tags: ["festival", "garba", "durga"], type: "festival", postIdeas: ["9-day colour series", "Garba night promo", "Day-wise outfit posts"] },
    { id: "dussehra-2025", name: "Dussehra / Vijayadashami", date: "2025-10-12", region: "india", tags: ["festival", "victory"], type: "festival", postIdeas: ["Good over evil themed post", "Dussehra sale launch"] },
    { id: "karwa-chauth-2025", name: "Karwa Chauth", date: "2025-10-22", region: "north", tags: ["festival", "family"], type: "festival", postIdeas: ["Couples offer", "Mehendi/makeup reel"] },
    { id: "diwali-2025", name: "Diwali", date: "2025-10-20", region: "india", tags: ["festival", "lights", "shopping", "diwali"], type: "festival", description: "Festival of lights — biggest shopping season", postIdeas: ["Diwali mega sale", "Diya decoration reel", "Customer Diwali wishes", "Gift guide post"] },
    { id: "bhai-dooj-2025", name: "Bhai Dooj", date: "2025-10-23", region: "india", tags: ["festival", "family", "sibling"], type: "festival", postIdeas: ["Sibling gifting post", "Combo offer"] },
    { id: "chhath-puja-2025", name: "Chhath Puja", date: "2025-10-28", region: "north", tags: ["festival", "bihar", "jharkhand", "up"], type: "festival", description: "Sun worship in Bihar/Jharkhand/UP", postIdeas: ["Sunrise photo contest", "Chhath greetings"] },
    { id: "guru-nanak-jayanti-2025", name: "Guru Nanak Jayanti", date: "2025-11-05", region: "north", tags: ["festival", "sikh", "punjabi"], type: "festival" },
    { id: "christmas-2025", name: "Christmas", date: "2025-12-25", region: "india", tags: ["festival", "seasonal", "shopping"], type: "festival", postIdeas: ["Christmas sale", "Year-end clearance", "New Year countdown"] },
    { id: "ipl-season-2025", name: "IPL Season", date: "2025-03-22", region: "india", tags: ["ipl", "cricket", "sports"], type: "sports", description: "Indian Premier League season", postIdeas: ["Match day offers", "Cricket themed reels", "Predict & win contest"] },
    { id: "womens-day-2025", name: "International Women's Day", date: "2025-03-08", region: "india", tags: ["campaign", "women"], type: "campaign", postIdeas: ["Women entrepreneur spotlight", "Special discount for women"] },
    { id: "diwali-dhanteras-2025", name: "Dhanteras", date: "2025-10-18", region: "india", tags: ["festival", "shopping", "gold"], type: "shopping", description: "Auspicious buying day before Diwali", postIdeas: ["Gold/electronics offer", "New product launch", "Dhanteras special deal"] },
    { id: "bihu-2025", name: "Bihu (Rongali/Bohag)", date: "2025-04-14", region: "northeast", tags: ["festival", "assam", "assamese"], type: "festival", description: "Assamese New Year", postIdeas: ["Bihu dance reel", "Assamese greeting post"] },
    { id: "vishu-2025", name: "Vishu", date: "2025-04-14", region: "south", tags: ["festival", "kerala", "malayalam"], type: "festival", description: "Malayalam New Year" },
    { id: "puthandu-2025", name: "Puthandu (Tamil New Year)", date: "2025-04-14", region: "south", tags: ["festival", "tamil", "new-year"], type: "festival" },
    { id: "lohri-2025", name: "Lohri", date: "2025-01-13", region: "north", tags: ["festival", "punjabi", "bonfire"], type: "festival", description: "Bonfire festival in Punjab/North India", postIdeas: ["Bonfire reel", "Winter sale offer"] },
    { id: "durga-puja-2025", name: "Durga Puja", date: "2025-10-09", region: "east", tags: ["festival", "bengali", "kolkata", "durga"], type: "festival", description: "Grand Bengal festival", postIdeas: ["Pandal hopping content", "Durga Puja look", "Bengali food reel"] },
  ],
  2026: [
    { id: "lohri-2026", name: "Lohri", date: "2026-01-13", region: "north", tags: ["festival", "punjabi", "bonfire"], type: "festival", postIdeas: ["Bonfire reel", "Winter sale offer"] },
    { id: "makar-sankranti-2026", name: "Makar Sankranti", date: "2026-01-14", region: "india", tags: ["festival", "harvest"], type: "festival", postIdeas: ["Special festive offer", "Til-gul greetings", "Kite festival photos"] },
    { id: "pongal-2026", name: "Pongal", date: "2026-01-14", region: "south", tags: ["festival", "harvest", "tamil"], type: "festival", postIdeas: ["Traditional Pongal pot photo", "Sweet Pongal recipe reel"] },
    { id: "republic-day-2026", name: "Republic Day", date: "2026-01-26", region: "india", tags: ["national", "india"], type: "campaign", postIdeas: ["Tricolour-themed post", "Patriotic offer/sale"] },
    { id: "basant-panchami-2026", name: "Basant Panchami", date: "2026-01-23", region: "india", tags: ["festival", "spring", "saraswati"], type: "festival" },
    { id: "maha-shivratri-2026", name: "Maha Shivratri", date: "2026-02-15", region: "india", tags: ["festival", "devotional"], type: "festival" },
    { id: "womens-day-2026", name: "International Women's Day", date: "2026-03-08", region: "india", tags: ["campaign", "women"], type: "campaign" },
    { id: "holi-2026", name: "Holi", date: "2026-03-04", region: "india", tags: ["festival", "colors"], type: "festival", postIdeas: ["Colour splash reel", "Holi sale campaign", "Before/after brand colours post"] },
    { id: "gudi-padwa-2026", name: "Gudi Padwa / Ugadi", date: "2026-03-20", region: "west", tags: ["festival", "marathi", "new-year"], type: "festival" },
    { id: "eid-al-fitr-2026", name: "Eid al-Fitr", date: "2026-03-21", region: "india", tags: ["festival", "eid"], type: "festival" },
    { id: "ipl-season-2026", name: "IPL Season Kickoff", date: "2026-03-22", region: "india", tags: ["ipl", "cricket", "sports"], type: "sports", postIdeas: ["Match day offers", "Cricket themed reels"] },
    { id: "ram-navami-2026", name: "Ram Navami", date: "2026-03-26", region: "india", tags: ["festival", "devotional"], type: "festival" },
    { id: "baisakhi-2026", name: "Baisakhi", date: "2026-04-13", region: "north", tags: ["festival", "harvest", "punjabi"], type: "festival" },
    { id: "bihu-2026", name: "Bihu", date: "2026-04-14", region: "northeast", tags: ["festival", "assam", "assamese"], type: "festival" },
    { id: "vishu-2026", name: "Vishu", date: "2026-04-14", region: "south", tags: ["festival", "kerala", "malayalam"], type: "festival" },
    { id: "puthandu-2026", name: "Puthandu (Tamil New Year)", date: "2026-04-14", region: "south", tags: ["festival", "tamil", "new-year"], type: "festival" },
    { id: "akshaya-tritiya-2026", name: "Akshaya Tritiya", date: "2026-05-19", region: "india", tags: ["festival", "gold", "shopping"], type: "shopping", postIdeas: ["Gold offer", "New product launch"] },
    { id: "eid-al-adha-2026", name: "Eid al-Adha (Bakrid)", date: "2026-05-27", region: "india", tags: ["festival", "eid"], type: "festival" },
    { id: "rath-yatra-2026", name: "Rath Yatra", date: "2026-06-16", region: "east", tags: ["festival", "puri", "odisha"], type: "festival" },
    { id: "guru-purnima-2026", name: "Guru Purnima", date: "2026-06-30", region: "india", tags: ["festival", "guru", "teacher"], type: "festival" },
    { id: "raksha-bandhan-2026", name: "Raksha Bandhan", date: "2026-08-28", region: "india", tags: ["festival", "family", "sibling"], type: "festival", postIdeas: ["Sibling discount code", "Gift hamper promo"] },
    { id: "independence-day-2026", name: "Independence Day", date: "2026-08-15", region: "india", tags: ["national", "india"], type: "campaign" },
    { id: "janmashtami-2026", name: "Janmashtami", date: "2026-09-04", region: "india", tags: ["festival", "devotional", "krishna"], type: "festival", postIdeas: ["Dahi handi reel", "Midnight celebration post"] },
    { id: "ganesh-chaturthi-2026", name: "Ganesh Chaturthi", date: "2026-09-02", region: "west", tags: ["festival", "maharashtra", "ganpati"], type: "festival", postIdeas: ["Ganpati Bappa morya reel", "Modak recipe content"] },
    { id: "onam-2026", name: "Onam", date: "2026-08-25", region: "south", tags: ["festival", "kerala", "malayalam"], type: "festival", postIdeas: ["Onam sadhya photo", "Pookalam rangoli contest"] },
    { id: "navratri-2026", name: "Navratri", date: "2026-10-02", region: "india", tags: ["festival", "garba", "durga"], type: "festival", postIdeas: ["9-day colour series", "Garba night promo"] },
    { id: "durga-puja-2026", name: "Durga Puja", date: "2026-10-09", region: "east", tags: ["festival", "bengali", "kolkata", "durga"], type: "festival", postIdeas: ["Pandal hopping content", "Bengali food reel"] },
    { id: "dussehra-2026", name: "Dussehra", date: "2026-10-12", region: "india", tags: ["festival", "victory"], type: "festival" },
    { id: "karwa-chauth-2026", name: "Karwa Chauth", date: "2026-10-10", region: "north", tags: ["festival", "family"], type: "festival" },
    { id: "dhanteras-2026", name: "Dhanteras", date: "2026-10-27", region: "india", tags: ["festival", "shopping", "gold"], type: "shopping", postIdeas: ["Gold/electronics offer", "New product launch"] },
    { id: "diwali-2026", name: "Diwali", date: "2026-10-29", region: "india", tags: ["festival", "lights", "shopping", "diwali"], type: "festival", postIdeas: ["Diwali mega sale", "Diya decoration reel", "Gift guide post"] },
    { id: "bhai-dooj-2026", name: "Bhai Dooj", date: "2026-10-31", region: "india", tags: ["festival", "family", "sibling"], type: "festival" },
    { id: "chhath-puja-2026", name: "Chhath Puja", date: "2026-11-07", region: "north", tags: ["festival", "bihar", "jharkhand", "up"], type: "festival" },
    { id: "guru-nanak-jayanti-2026", name: "Guru Nanak Jayanti", date: "2026-11-25", region: "north", tags: ["festival", "sikh", "punjabi"], type: "festival" },
    { id: "christmas-2026", name: "Christmas", date: "2026-12-25", region: "india", tags: ["festival", "seasonal", "shopping"], type: "festival", postIdeas: ["Christmas sale", "Year-end clearance"] },
  ],
  2027: [
    { id: "lohri-2027", name: "Lohri", date: "2027-01-13", region: "north", tags: ["festival", "punjabi", "bonfire"], type: "festival" },
    { id: "makar-sankranti-2027", name: "Makar Sankranti", date: "2027-01-14", region: "india", tags: ["festival", "harvest"], type: "festival" },
    { id: "pongal-2027", name: "Pongal", date: "2027-01-14", region: "south", tags: ["festival", "harvest", "tamil"], type: "festival" },
    { id: "republic-day-2027", name: "Republic Day", date: "2027-01-26", region: "india", tags: ["national", "india"], type: "campaign" },
    { id: "maha-shivratri-2027", name: "Maha Shivratri", date: "2027-02-04", region: "india", tags: ["festival", "devotional"], type: "festival" },
    { id: "holi-2027", name: "Holi", date: "2027-03-22", region: "india", tags: ["festival", "colors"], type: "festival" },
    { id: "eid-al-fitr-2027", name: "Eid al-Fitr", date: "2027-03-09", region: "india", tags: ["festival", "eid"], type: "festival" },
    { id: "gudi-padwa-2027", name: "Gudi Padwa / Ugadi", date: "2027-03-22", region: "west", tags: ["festival", "marathi", "new-year"], type: "festival" },
    { id: "baisakhi-2027", name: "Baisakhi", date: "2027-04-13", region: "north", tags: ["festival", "harvest", "punjabi"], type: "festival" },
    { id: "bihu-2027", name: "Bihu", date: "2027-04-14", region: "northeast", tags: ["festival", "assam"], type: "festival" },
    { id: "akshaya-tritiya-2027", name: "Akshaya Tritiya", date: "2027-05-08", region: "india", tags: ["festival", "gold", "shopping"], type: "shopping" },
    { id: "eid-al-adha-2027", name: "Eid al-Adha (Bakrid)", date: "2027-05-16", region: "india", tags: ["festival", "eid"], type: "festival" },
    { id: "raksha-bandhan-2027", name: "Raksha Bandhan", date: "2027-08-17", region: "india", tags: ["festival", "family", "sibling"], type: "festival" },
    { id: "independence-day-2027", name: "Independence Day", date: "2027-08-15", region: "india", tags: ["national", "india"], type: "campaign" },
    { id: "janmashtami-2027", name: "Janmashtami", date: "2027-08-25", region: "india", tags: ["festival", "devotional", "krishna"], type: "festival" },
    { id: "ganesh-chaturthi-2027", name: "Ganesh Chaturthi", date: "2027-09-21", region: "west", tags: ["festival", "maharashtra", "ganpati"], type: "festival" },
    { id: "onam-2027", name: "Onam", date: "2027-09-14", region: "south", tags: ["festival", "kerala", "malayalam"], type: "festival" },
    { id: "navratri-2027", name: "Navratri", date: "2027-10-07", region: "india", tags: ["festival", "garba", "durga"], type: "festival" },
    { id: "dussehra-2027", name: "Dussehra", date: "2027-10-17", region: "india", tags: ["festival", "victory"], type: "festival" },
    { id: "diwali-2027", name: "Diwali", date: "2027-11-07", region: "india", tags: ["festival", "lights", "shopping", "diwali"], type: "festival", postIdeas: ["Diwali mega sale", "Gift guide post"] },
    { id: "chhath-puja-2027", name: "Chhath Puja", date: "2027-11-12", region: "north", tags: ["festival", "bihar", "jharkhand", "up"], type: "festival" },
    { id: "christmas-2027", name: "Christmas", date: "2027-12-25", region: "india", tags: ["festival", "seasonal", "shopping"], type: "festival" },
  ],
};

/** Backward-compatible export — 2026 events */
export const INDIA_EVENTS_2026: IndiaFestivalEvent[] = INDIA_EVENTS_BY_YEAR[2026] ?? [];

/** Return all events across every year we have data for */
export function getAllIndiaEvents(): IndiaFestivalEvent[] {
  return Object.values(INDIA_EVENTS_BY_YEAR).flat();
}

const languagePrefix: Record<IndiaLanguage, string> = {
  english: "Celebrate",
  hindi: "Shubh avsar par",
  hinglish: "Iss festive moment par",
  marathi: "Ya sanacha nimitta",
  tamil: "Intha vizha nerathil",
  bengali: "Ei utsober somoye",
  gujarati: "Aa parv par",
  telugu: "Ee panduga sandarbhanga",
  kannada: "Ee habba sandarbhadalli",
  malayalam: "Ee utsava veleyil",
  punjabi: "Is tyohaar maukey tey",
};

const languageGreeting: Record<IndiaLanguage, string> = {
  english: "Wishing you a wonderful",
  hindi: "Aapko hardik shubhkamnayein",
  hinglish: "Happy wali vibes for",
  marathi: "Tumhala shubhechha",
  tamil: "Ungalukku nal vazhthukkal",
  bengali: "Subho",
  gujarati: "Tumne shubhkamna",
  telugu: "Meeku shubhakankshalu",
  kannada: "Nimage shubhashayagalu",
  malayalam: "Ningalkku aashamsagal",
  punjabi: "Tuhanu lakh lakh vadhaiyan",
};

export function listUpcomingIndiaEvents(fromDate: Date, daysAhead = 45): IndiaFestivalEvent[] {
  const start = +new Date(fromDate.toISOString().slice(0, 10));
  const end = start + daysAhead * 24 * 60 * 60 * 1000;
  const allEvents = getAllIndiaEvents();

  return allEvents
    .filter((item) => {
      const d = +new Date(item.date);
      return d >= start && d <= end;
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));
}

export function listEventsByRegion(region: IndiaFestivalEvent["region"], year?: number): IndiaFestivalEvent[] {
  const events = year ? (INDIA_EVENTS_BY_YEAR[year] ?? []) : getAllIndiaEvents();
  if (region === "india") return events;
  return events.filter((e) => e.region === region || e.region === "india");
}

export function buildFestivalCaptionTemplate(input: {
  event: IndiaFestivalEvent;
  businessName?: string;
  niche?: string;
  language: IndiaLanguage;
}): string {
  const prefix = languagePrefix[input.language];
  const greeting = languageGreeting[input.language];
  const businessLine = input.businessName ? ` from ${input.businessName}` : "";
  const nicheLine = input.niche ? ` for ${input.niche} audience` : "";
  const postIdeasLine =
    input.event.postIdeas && input.event.postIdeas.length > 0
      ? ` Post ideas: ${input.event.postIdeas.join(", ")}.`
      : "";

  return `${greeting} ${input.event.name}! ${prefix} this occasion${businessLine}${nicheLine}. Offer value, festive emotion, and one clear CTA for local customers.${postIdeasLine}`;
}

/** Build a detailed AI prompt for generating festival-specific content */
export function buildFestivalAIPrompt(input: {
  event: IndiaFestivalEvent;
  businessName?: string;
  niche?: string;
  language: IndiaLanguage;
  tone?: string;
  channel?: string;
}): string {
  const langInstruction = languagePrefix[input.language];
  const postIdeas = input.event.postIdeas?.join(", ") || "festive greeting, special offer, behind-the-scenes";
  return [
    `Generate a ${input.tone || "engaging"} social media caption for ${input.event.name} (${input.event.date}).`,
    input.event.description ? `Context: ${input.event.description}.` : "",
    `Region: ${input.event.region}. Tags: ${input.event.tags.join(", ")}.`,
    input.businessName ? `Business: ${input.businessName}.` : "",
    input.niche ? `Niche: ${input.niche}.` : "",
    `Language: Write in ${input.language}. ${langInstruction}.`,
    `Post ideas to consider: ${postIdeas}.`,
    input.channel ? `Optimise for ${input.channel}.` : "",
    "Include relevant emojis, a festive greeting, and one clear call-to-action.",
    "Also suggest 5-8 hashtags.",
  ].filter(Boolean).join("\n");
}
