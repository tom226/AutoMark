class ResendClient {
  constructor({ apiKey, fromEmail, dailyLimit = 100 }) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.dailyLimit = dailyLimit;
    this.sentToday = 0;
    this.lastResetDate = new Date().toDateString();
  }

  _checkLimit() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) { this.sentToday = 0; this.lastResetDate = today; }
    if (this.sentToday >= this.dailyLimit) throw new Error('Daily email limit reached');
  }

  async send({ to, subject, html }) {
    this._checkLimit();
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.fromEmail, to, subject, html }),
    });
    if (!res.ok) throw new Error(`Resend error: ${res.status} ${await res.text()}`);
    this.sentToday++;
    return res.json();
  }

  async sendReport({ to, subject, stats }) {
    const html = `<h2>${subject}</h2><pre>${JSON.stringify(stats, null, 2)}</pre>`;
    return this.send({ to, subject, html });
  }
}

module.exports = ResendClient;