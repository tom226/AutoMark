class RedditClient {
  constructor({ clientId, clientSecret, username, password }) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.username = username;
    this.password = password;
    this.accessToken = null;
    this.tokenExpiry = 0;
  }

  async authenticate() {
    if (this.accessToken && Date.now() < this.tokenExpiry) return;
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=password&username=${this.username}&password=${this.password}`,
    });
    const data = await res.json();
    if (data.error) throw new Error(`Reddit auth error: ${data.error}`);
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  }

  async submitPost(subreddit, title, text) {
    await this.authenticate();
    const res = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `sr=${subreddit}&kind=self&title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`,
    });
    if (!res.ok) throw new Error(`Reddit submit error: ${res.status}`);
    return res.json();
  }

  async getPostMetrics(postId) {
    await this.authenticate();
    const res = await fetch(`https://oauth.reddit.com/api/info?id=t3_${postId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return res.json();
  }
}

module.exports = RedditClient;