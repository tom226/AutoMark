const { createClient } = require('@supabase/supabase-js');
const AIClient = require('../integrations/claude');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const ai = new AIClient({ apiKey: process.env.OPENROUTER_API_KEY, model: process.env.AI_MODEL });

async function generateContent() {
  const { data: insights } = await supabase.from('competitor_insights').select('*').limit(10);
  const { data: performance } = await supabase.from('post_performance').select('*').order('created_at', { ascending: false }).limit(20);

  const posts = await ai.promptJSON(
    'You are an expert social media marketer. Generate engaging posts for multiple platforms. Return a JSON array of objects with: platform, content, hashtags[], tone, bestPostTime.',
    `Based on these competitor insights and past performance, generate 5 new social media posts:\n\nInsights: ${JSON.stringify(insights || [])}\nPerformance: ${JSON.stringify(performance || [])}`
  );

  if (Array.isArray(posts)) {
    await supabase.from('content_queue').insert(posts.map(p => ({
      platform: p.platform,
      content: p.content,
      hashtags: p.hashtags,
      status: 'draft',
      created_at: new Date().toISOString(),
    })));
  }

  return { generated: posts?.length || 0, stats: ai.getStats() };
}

module.exports = { generateContent };