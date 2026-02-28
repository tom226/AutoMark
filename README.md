# AutoMark - Autonomous AI Marketing Platform

> Zero manual effort. AI researches, writes, schedules, and optimizes all content.

## Architecture

```
[RESEARCH] Apify scrapes competitor posts daily
     |
[ANALYSIS] Claude AI extracts trends, hooks, topics
     |
[GENERATION] Claude generates 56 platform-optimized posts/week
     |
[POSTING] Buffer API + Reddit API auto-post at optimal times
     |
[FEEDBACK] Engagement metrics fed back to improve future content
```

## Tech Stack (Free Tier - $0-3/mo)

| Tool | Purpose |
|------|---------|
| n8n (Railway) | Automation engine |
| Claude API (Haiku) | AI content generation |
| Buffer | Social scheduling |
| Supabase | PostgreSQL database |
| Apify | Competitor scraping |
| Resend | Email reports |

## Project Structure

```
AutoMark/
├── dashboard/          # Next.js monitoring dashboard
├── server/
│   ├── index.js        # Express server
│   ├── services/       # Core business logic
│   │   ├── competitor.js   # Competitor analysis
│   │   ├── content.js      # AI content generation
│   │   ├── poster.js       # Auto-posting
│   │   └── analytics.js    # Performance tracking
│   ├── integrations/   # API clients
│   │   ├── twitter.js, linkedin.js, reddit.js, instagram.js
│   │   ├── buffer.js, apify.js, claude.js, resend.js
│   │   └── ...
│   └── prompts/        # Claude prompt templates
├── database/
│   └── schema.sql      # Supabase PostgreSQL schema
├── workflows/          # n8n workflow definitions
├── config/
│   └── env.example     # Environment variables template
├── docs/               # Setup guides, content strategy
└── PRD.md              # Product Requirements Document
```

## Quick Start

1. Clone repo
2. Copy `config/env.example` to `.env` and fill in API keys
3. Run `database/schema.sql` in Supabase SQL Editor
4. `cd server && npm install && node index.js`
5. `cd dashboard && npm install && npm run dev`
6. Deploy n8n on Railway and import workflows

## Platforms

Twitter/X · LinkedIn · Instagram · Reddit