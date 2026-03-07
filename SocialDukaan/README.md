# AutoMark — AI-Powered Social Media Autopilot for India

> **Your personal social media team — powered by AI, costs less than a ☕ chai.**

AutoMark is a zero-complexity, AI-first social media management platform built for India's small businesses, creators, and agencies. It automates what to post, when to post, and how to grow — so you can focus on running your business.

## 🚀 Features (MVP Phase)

- **🤖 AI Post Generator** — Write. One keyword → 3 ready-to-publish variants with captions, hashtags, emojis
- **📅 Monthly Content Calendar** — AI pre-fills an entire month including Indian festivals
- **🗓️ Best-Time AI Scheduler** — Auto-posts at peak engagement times (IST optimized)
- **🌍 Cross-Platform Publishing** — Instagram, Facebook, LinkedIn, X, YouTube, Google Business, WhatsApp
- **💬 Unified Inbox** — All DMs, comments, mentions in one place
- **🤖 Smart Replies** — 3 context-aware reply suggestions for every message
- **📊 AutoMark Score** — Single 0–100 health score. No charts to decode
- **📈 Plain-English Analytics** — "What's working" reports every Monday
- **🎯 Hashtag Intelligence** — Ranked hashtag sets per niche
- **🔥 Trending Topics Feed** — India-specific viral hooks refreshed every 4 hours

## 🎮 Gamification

- **🔥 Posting Streaks** — Daily habit tracking with streak shield
- **🏆 Achievement Badges** — First post, viral moment, 365-day legend
- **📊 AutoMark Score** — Consistency, engagement, growth, reach, response rate
- **🎯 Level-Up System** — Beginner → Creator → Influencer → Brand → Legend

## 💳 Monetization

- **Free** — ₹0 (3 accounts, 15 posts/month)
- **Starter** — ₹499/month (unlimited scheduling, Hindi AI, all features)
- **Pro** — ₹1,499/month (team collab, white-label reports, A/B testing)
- **Agency** — ₹4,999/month (unlimited accounts, white-label, API)

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (React, App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- Zustand (state management)

**Backend:**
- Node.js + Fastify
- PostgreSQL (primary DB)
- Redis (caching, queues)
- BullMQ (job scheduling)

**AI & Integrations:**
- OpenAI GPT-4o (content generation, Hindi support)
- Social platform APIs (Meta, X, YouTube, LinkedIn)
- Razorpay (UPI payments)
- WhatsApp Business API (phase 2)

## 📋 Project Structure

```
automark/
├── app/                         # Next.js App Router
│   ├── api/                     # API endpoints
│   │   ├── posts/               # Content creation
│   │   ├── analytics/           # Analytics & scoring
│   │   ├── inbox/               # Unified messaging
│   │   ├── trends/              # Trending topics
│   │   ├── hashtags/            # Hashtag suggestions
│   │   ├── accounts/            # Social account management
│   │   ├── billing/             # Payment handling
│   │   └── auth/                # Authentication
│   ├── dashboard/               # Main dashboard
│   ├── compose/                 # Post creation flow
│   ├── calendar/                # Content calendar
│   ├── inbox/                   # Message inbox
│   ├── analytics/               # Analytics dashboard
│   └── settings/                # User settings
├── components/                  # React components
├── lib/                         # Utilities & services
│   ├── ai/                      # AI generation logic
│   ├── social-publisher.ts      # Multi-platform publishing
│   ├── ai-content.ts            # Content generation
│   ├── gamification.ts          # Score & streak logic
│   └── types.ts                 # TypeScript types
├── public/                      # Static assets
├── prisma/                      # Database schemas
├── styles/                      # Global styles
├── middleware.ts                # Authentication middleware
└── next.config.js               # Next.js config
```

## 🚦 Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Add your API keys:
   # - OPENAI_API_KEY
   # - DATABASE_URL (PostgreSQL)
   # - REDIS_URL
   # - NEXT_AUTH_SECRET
   # - Meta / X / YouTube API credentials
   # - RAZORPAY_KEY_ID & RAZORPAY_SECRET
   ```

3. **Set up database:**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open:** http://localhost:3000

## 🧪 Available Commands

- `npm run dev` — Start dev server (port 3000)
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript checks
- `npm run check` — Run both lint & typecheck
- `npm run db:migrate` — Run database migrations
- `npm run db:generate` — Generate Prisma client

## 📱 Android App (Progressive Web App)

AutoMark is a PWA that works on Android like a native app.

1. Build production version:
   ```bash
   npm run build
   npm run start
   ```

2. Open in Chrome on Android
3. Tap **Install app** or **Add to Home screen**
4. Launch AutoMark directly from app drawer

## 🌐 Supported Platforms

- **Social Media:** Instagram, Facebook, LinkedIn, X/Twitter, YouTube, Google Business
- **Messaging:** WhatsApp Business (Phase 2)
- **E-commerce:** Shopify, WooCommerce, Meesho, Instamojo (Phase 2)

## 🇮🇳 India-First Features

- ✅ Hindi + Hinglish AI caption generation
- ✅ IST timezone optimization
- ✅ 20+ Indian festival auto-posts (Diwali, Holi, Raksha Bandhan, etc.)
- ✅ UPI payment support (GPay, PhonePe, Paytm)
- ✅ WhatsApp integration (Phase 2)
- ✅ Regional language support planned (Tamil, Telugu, Marathi)

## 📊 Phase 1 Roadmap (Months 1-3)

- [x] Project setup & infrastructure
- [ ] AI Post Generator
- [ ] Monthly Content Calendar
- [ ] Cross-Platform Publishing
- [ ] Best-Time Scheduler
- [ ] Unified Inbox & Smart Replies
- [ ] AutoMark Score & Analytics
- [ ] Gamification (streaks, badges, score)
- [ ] Trending Topics Feed
- [ ] Hashtag Intelligence
- [ ] Festival Auto-Poster
- [ ] Onboarding flow (10-minute signup)
- [ ] Mobile app (PWA + React Native)

## 📞 Support & Feedback

- **Documentation:** (Coming soon)
- **GitHub Issues:** Report bugs
- **Email:** support@automark.app (Coming soon)

## 📄 License

UNLICENSED - Internal use only

---

**Built with ❤️ by Automark Lab for India's creators & businesses** 🇮🇳

Offline fallback is available at `/~offline` when connectivity is lost.

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate` - Generate caption + hashtags
- `POST /api/content/score` - Pre-post intelligence score with plain-English improvement actions
- `POST /api/content/fix` - One-click AI-style caption improvement using top score fixes
- `GET /api/auth/accounts` - Get connected Facebook/Instagram accounts
- `DELETE /api/auth/accounts` - Disconnect accounts
- `GET /api/auth/meta` - Start Meta OAuth
- `GET /api/auth/meta/callback` - Meta OAuth callback
- `POST /api/social/post` - Post now to selected page/channel
- `POST /api/autopilot/run` - Run one immediate autopilot post
- `GET /api/autopilot/settings` - Read saved autopilot settings
- `PUT /api/autopilot/settings` - Save autopilot settings
- `POST /api/autopilot/process` - Process due queued autopilot jobs
- `GET /api/autopilot/optimize` - Generate autonomous optimization recommendations
- `POST /api/tools/post-automation` - Generate research-backed batch drafts, optionally save to review queue
- `GET /api/experiments` - List A/B experiments
- `POST /api/experiments` - Create, track, and evaluate A/B experiments

## Deployment

### Vercel

- Connect repository to Vercel
- Set Node.js runtime to 20+
- Add environment variables: `META_APP_ID`, `META_APP_SECRET`
- For durable autonomy on serverless, add: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- Deploy (uses `vercel.json`)

#### Unattended Autopilot (Cron)

- `vercel.json` is configured to trigger `POST /api/autopilot/process` every 15 minutes.
- Keep Autopilot settings enabled from the dashboard, then jobs are processed automatically on cron ticks.
- For true production reliability, move token and queue state from local files to persistent storage (database/redis).

### Docker

```bash
docker build -t social-dukaan .
docker run -p 3000:3000 social-dukaan
```

Or:

```bash
docker compose up --build
```

## Notes

- Use Node.js 20+ for stable development and production behavior.
- Connected tokens are stored locally in `.tokens.json` for development.
- Autopilot queue state is stored locally in `.autopilot.json` for development.
- In production serverless environments, local JSON files are not durable. Use persistent storage for `.tokens.json` and `.autopilot.json` equivalents.
- Queue processor now retries failed jobs with exponential backoff before marking them as failed.
- Content guardrails block unsafe/invalid posts before publish attempts.
- When Redis REST env vars are present, tokens and autopilot state are stored in Redis keys (`socialdukaan:tokens`, `socialdukaan:autopilot`).
- Autopilot scheduler automatically reuses the latest completed experiment winner caption for matching channel/page.
