class LinkedInClient {
  constructor({ accessToken, orgId }) {
    this.accessToken = accessToken;
    this.orgId = orgId;
    this.baseUrl = 'https://api.linkedin.com/v2';
  }

  async postToPage(text) {
    const url = `${this.baseUrl}/ugcPosts`;
    const body = {
      author: `urn:li:organization:${this.orgId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`LinkedIn API error: ${res.status} ${await res.text()}`);
    return res.json();
  }

  async getPostAnalytics(postUrn) {
    const url = `${this.baseUrl}/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${this.orgId}&shares[0]=${postUrn}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
    if (!res.ok) throw new Error(`LinkedIn analytics error: ${res.status}`);
    return res.json();
  }
}

module.exports = LinkedInClient;