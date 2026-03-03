# SocialDukaan

Deploy-ready Next.js web application for generating and scheduling social media content.

## Tech Stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Route Handlers for API endpoints

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open http://localhost:3000

## Commands

- `npm run dev` - Start local dev server
- `npm run lint` - Run lint checks
- `npm run typecheck` - Run TypeScript checks
- `npm run build` - Build for production
- `npm run start` - Start production server

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/generate` - Generate caption + hashtags
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

- Local machine currently uses Node 16; for production use Node 20+.
- Connected tokens are stored locally in `.tokens.json` for development.
- Autopilot queue state is stored locally in `.autopilot.json` for development.
- In production serverless environments, local JSON files are not durable. Use persistent storage for `.tokens.json` and `.autopilot.json` equivalents.
- Queue processor now retries failed jobs with exponential backoff before marking them as failed.
- Content guardrails block unsafe/invalid posts before publish attempts.
- When Redis REST env vars are present, tokens and autopilot state are stored in Redis keys (`socialdukaan:tokens`, `socialdukaan:autopilot`).
- Autopilot scheduler automatically reuses the latest completed experiment winner caption for matching channel/page.
