class BufferClient {
  constructor({ accessToken, profileIds }) {
    this.token = accessToken;
    this.profileIds = profileIds; // { twitter, linkedin, instagram }
    this.baseUrl = 'https://api.bufferapp.com/1';
  }

  async createPost(platform, text, scheduledAt) {
    const profileId = this.profileIds[platform];
    if (!profileId) throw new Error(`No Buffer profile for ${platform}`);
    const res = await fetch(`${this.baseUrl}/updates/create.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `access_token=${this.token}&profile_ids[]=${profileId}&text=${encodeURIComponent(text)}&scheduled_at=${scheduledAt}`,
    });
    if (!res.ok) throw new Error(`Buffer error: ${res.status}`);
    return res.json();
  }

  async getPostAnalytics(updateId) {
    const res = await fetch(`${this.baseUrl}/updates/${updateId}/interactions.json?access_token=${this.token}`);
    return res.json();
  }
}

module.exports = BufferClient;