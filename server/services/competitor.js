const { createClient } = require('@supabase/supabase-js');
const AIClient = require('../integrations/claude');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ai = new AIClient({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.AI_MODEL });

async function scrapeCompetitorPosts(competitorUrls = []) {
  // If Apify is configured, use it; otherwise just analyze provided URLs
  let rawData = [];

  if (process.env.APIFY_API_TOKEN && competitorUrls.length > 0) {
    try {
      const res = await fetch(`https://api.apify.com/v2/acts/apify~web-scraper/runs?token=${process.env.APIFY_API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startUrls: competitorUrls.map(url => ({ url })),
          maxPagesPerCrawl: 10,
        }),
      });
      const run = await res.json();
      rawData = run.data?.items || [];
    } catch (err) {
      console.warn('Apify scrape failed, using AI analysis only:', err.message);
    }
  }

  // Store raw data
  if (rawData.length > 0) {
    await supabase.from('raw_data').insert(rawData.map(d => ({ data: d, source: 'apify', created_at: new Date().toISOString() })));
  }

  // Analyze with AI
  const analysis = await ai.promptJSON(
    'You are a competitive intelligence analyst. Analyze the competitor data and return JSON with: strengths[], weaknesses[], opportunities[], contentThemes[], postingFrequency, engagementPatterns.',
    `Analyze this competitor data: ${JSON.stringify(rawData.length > 0 ? rawData : competitorUrls)}`
  );

  await supabase.from('competitor_insights').insert([{
    insights: analysis,
    analyzed_at: new Date().toISOString(),
  }]);

  return { insights: analysis, stats: ai.getStats() };
}

module.exports = { scrapeCompetitorPosts };