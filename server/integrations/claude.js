const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

class AIClient {
  constructor({ apiKey, model = 'qwen/qwen3-coder' }) {
    this.apiKey = apiKey;
    this.model = model;
    this.totalTokensIn = 0;
    this.totalTokensOut = 0;
    this.totalCost = 0;
  }

  async prompt(systemPrompt, userMessage, { maxTokens = 4096, retries = 3 } = {}) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://automark.local',
            'X-Title': 'AutoMark',
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`OpenRouter ${res.status}: ${errText}`);
        }

        const data = await res.json();
        const usage = data.usage || {};
        this.totalTokensIn += usage.prompt_tokens || 0;
        this.totalTokensOut += usage.completion_tokens || 0;
        // Free models = $0, paid models priced per OpenRouter
        this.totalCost += (data.usage?.total_cost || 0);

        return data.choices[0].message.content;
      } catch (err) {
        if (attempt === retries - 1) throw err;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  async promptJSON(systemPrompt, userMessage, opts = {}) {
    const raw = await this.prompt(systemPrompt + '\nRespond ONLY with valid JSON.', userMessage, opts);
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('No JSON found in AI response');
    return JSON.parse(match[0]);
  }

  getStats() {
    return { tokensIn: this.totalTokensIn, tokensOut: this.totalTokensOut, cost: this.totalCost.toFixed(4) };
  }
}

module.exports = AIClient;