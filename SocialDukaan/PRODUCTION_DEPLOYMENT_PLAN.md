# SocialDukaan Production Node Deployment Plan

## 1. Objective
Deploy SocialDukaan as a full Node.js app (not static export) with API routes, auth callbacks, scheduler endpoints, and production observability.

This plan assumes:
- App: Next.js 14 (App Router + API routes)
- Runtime: Node.js 20+
- Source: `E:\VS Code Projects\SocialDukaan`

## 2. Recommended Hosting Model
Use a dedicated Node-capable environment for full functionality.

### Recommended Option A (Fastest + stable)
- App hosting: Vercel (Next.js native)
- Database: Managed PostgreSQL (Neon/Supabase/Hostinger managed PG)
- Cache/queue token store: Upstash Redis REST
- Domain: `socialdukaan.rungreen.in`

### Recommended Option B (Full control)
- Hostinger VPS (Ubuntu 22.04)
- Reverse proxy: Nginx
- App process manager: PM2
- Database: Managed PostgreSQL (preferred) or separate DB VM
- Redis: Managed Redis (preferred)
- TLS: Let's Encrypt

Note: Shared/static hosting subfolder cannot run full Next API/auth workflows reliably.

## 3. Target Architecture
- Client -> `socialdukaan.rungreen.in` (HTTPS)
- Nginx (443) -> Next.js app (`localhost:3000`)
- Next.js app -> PostgreSQL + Redis REST + external OAuth APIs
- Scheduled jobs -> cron/webhook hitting `/api/autopilot/process`
- CI/CD -> GitHub Actions deploy pipeline

## 4. Domain and Routing Plan
- Keep `rungreen.in` for corporate site.
- Use dedicated subdomain for Node app:
  - `socialdukaan.rungreen.in` -> Node host
- OAuth callback URLs must be updated to this subdomain:
  - `/api/auth/meta/callback`
  - `/api/auth/linkedin/callback`
  - `/api/auth/twitter/callback`

## 5. Environment Variables (Production)
Create production secrets (do not commit):

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_NAME=SocialDukaan`
- `NEXT_PUBLIC_APP_URL=https://socialdukaan.rungreen.in`

OAuth:
- `META_APP_ID`
- `META_APP_SECRET`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_SCOPES=openid profile email`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `TWITTER_SCOPES=tweet.read users.read`

State/token backend:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

If DB-backed features are enabled later:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_URL` (if direct Redis is used)

## 6. Production Build/Run Contract
On server (Node 20+):

```bash
npm ci
npm run build
npm run start
```

Health endpoint:
- `GET /api/health`

## 7. CI/CD Plan (GitHub Actions)
Create 2 workflows:

1) `ci.yml` (already exists)
- lint, typecheck, build

2) `deploy.yml` (add)
- Trigger: push to `main` and manual dispatch
- Steps:
  - Checkout
  - Setup Node 20
  - `npm ci`
  - `npm run build`
  - Deploy artifact/app to target host
  - Smoke test `/api/health`

For VPS deployment, use SSH action to:
- pull latest code
- `npm ci --omit=dev`
- `npm run build`
- restart PM2 process

## 8. VPS Runtime Setup (Option B)

### 8.1 Base setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx certbot python3-certbot-nginx git
# install Node 20 LTS via nvm or NodeSource
```

### 8.2 App directory
- `/srv/socialdukaan`
- Environment file: `/srv/socialdukaan/.env.production`

### 8.3 PM2 process
```bash
pm2 start npm --name socialdukaan -- run start
pm2 save
pm2 startup
```

### 8.4 Nginx reverse proxy
- Route `socialdukaan.rungreen.in` to `127.0.0.1:3000`
- Force HTTPS
- Enable gzip and cache headers for static assets

### 8.5 TLS
```bash
sudo certbot --nginx -d socialdukaan.rungreen.in
```

## 9. Data and Backup Strategy
- PostgreSQL: daily automated backups + 7/14-day retention
- Redis/KV: managed service backups (if available)
- Keep encrypted backup of `.env.production` in secure vault

## 10. Security Hardening
- Enforce Node 20+ only
- Limit inbound ports (80/443 only)
- Use UFW and fail2ban on VPS
- Rotate OAuth client secrets quarterly
- Never log access tokens or secrets
- Add rate limiting for auth and AI-heavy endpoints

## 11. Observability
- App logs: PM2 logs + central logging (optional Logtail/Datadog)
- Uptime monitor: `/api/health` every 1 minute
- Error tracking: Sentry for Next.js
- Basic SLO target:
  - uptime >= 99.5%
  - p95 latency under 1.5s for key APIs

## 12. Release and Rollback
### Release process
1. Merge to `main`
2. CI green
3. Deploy to staging URL
4. Smoke tests
5. Production deploy
6. Verify OAuth callbacks and `/api/health`

### Rollback process
- Keep previous build artifact/process
- `pm2 restart socialdukaan --update-env` with previous version
- Repoint Nginx if needed
- Validate health endpoint and core pages

## 13. Production Readiness Checklist
- [ ] Node runtime 20+ confirmed
- [ ] Domain `socialdukaan.rungreen.in` mapped
- [ ] TLS active and auto-renew working
- [ ] All env secrets set and validated
- [ ] OAuth redirect URIs updated in Meta/LinkedIn/X
- [ ] `/api/health` returns 200
- [ ] Scheduled autopilot job active
- [ ] Monitoring + alerting enabled
- [ ] Backup and restore tested
- [ ] Rollback runbook tested

## 14. Practical Next Step for You
Because `rungreen.in` is currently static-host focused, deploy SocialDukaan full app on a Node-capable target (Vercel or Hostinger VPS) and connect via `socialdukaan.rungreen.in`.

This gives you full API/auth functionality while keeping `rungreen.in` corporate site untouched.
