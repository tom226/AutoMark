const crypto = require('crypto');

class TwitterClient {
  constructor({ apiKey, apiSecret, accessToken, accessSecret }) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.accessToken = accessToken;
    this.accessSecret = accessSecret;
    this.baseUrl = 'https://api.twitter.com/2';
    this.monthlyPosts = 0;
    this.MONTHLY_LIMIT = 1500;
  }

  _oauthHeader(method, url, params = {}) {
    const oauth = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_token: this.accessToken,
      oauth_version: '1.0',
    };
    const allParams = { ...oauth, ...params };
    const baseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(
      Object.keys(allParams).sort().map(k => `${k}=${encodeURIComponent(allParams[k])}`).join('&')
    )}`;
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(this.accessSecret)}`;
    oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
    return 'OAuth ' + Object.keys(oauth).sort().map(k => `${k}="${encodeURIComponent(oauth[k])}"`).join(', ');
  }

  async postTweet(text, replyToId = null) {
    if (this.monthlyPosts >= this.MONTHLY_LIMIT) throw new Error('Monthly tweet limit reached');
    const url = `${this.baseUrl}/tweets`;
    const body = { text };
    if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: this._oauthHeader('POST', url), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Twitter API error: ${res.status} ${await res.text()}`);
    this.monthlyPosts++;
    return res.json();
  }

  async postThread(tweets) {
    let lastId = null;
    const results = [];
    for (const tweet of tweets) {
      const result = await this.postTweet(tweet, lastId);
      lastId = result.data.id;
      results.push(result);
      await new Promise(r => setTimeout(r, 1000));
    }
    return results;
  }

  async getTweetMetrics(tweetId) {
    const url = `${this.baseUrl}/tweets/${tweetId}?tweet.fields=public_metrics`;
    const res = await fetch(url, { headers: { Authorization: this._oauthHeader('GET', url) } });
    if (!res.ok) throw new Error(`Twitter metrics error: ${res.status}`);
    return res.json();
  }
}

module.exports = TwitterClient;