class InstagramClient {
  constructor({ pageAccessToken, igBusinessAccountId }) {
    this.token = pageAccessToken;
    this.igId = igBusinessAccountId;
    this.baseUrl = 'https://graph.facebook.com/v18.0';
  }

  async postImage(imageUrl, caption) {
    const createRes = await fetch(`${this.baseUrl}/${this.igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, access_token: this.token }),
    });
    const { id: creationId } = await createRes.json();
    const publishRes = await fetch(`${this.baseUrl}/${this.igId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: creationId, access_token: this.token }),
    });
    return publishRes.json();
  }

  async getMediaInsights(mediaId) {
    const res = await fetch(`${this.baseUrl}/${mediaId}/insights?metric=impressions,reach,likes,comments,shares&access_token=${this.token}`);
    return res.json();
  }
}

module.exports = InstagramClient;