class ApifyClient {
  constructor({ apiToken }) {
    this.token = apiToken;
    this.baseUrl = 'https://api.apify.com/v2';
  }

  async runActor(actorId, input) {
    const res = await fetch(`${this.baseUrl}/acts/${actorId}/runs?token=${this.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error(`Apify run error: ${res.status}`);
    return res.json();
  }

  async waitForRun(runId, maxWaitMs = 120000) {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      const res = await fetch(`${this.baseUrl}/actor-runs/${runId}?token=${this.token}`);
      const data = await res.json();
      if (data.data.status === 'SUCCEEDED') return data;
      if (data.data.status === 'FAILED') throw new Error('Apify run failed');
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error('Apify run timeout');
  }

  async getDatasetItems(datasetId) {
    const res = await fetch(`${this.baseUrl}/datasets/${datasetId}/items?token=${this.token}`);
    return res.json();
  }

  async scrapeTwitter(handles) {
    return this.runActor('apify/twitter-scraper', { handles, maxTweets: 20 });
  }

  async scrapeInstagram(profiles) {
    return this.runActor('apify/instagram-scraper', { directUrls: profiles, resultsLimit: 20 });
  }
}

module.exports = ApifyClient;