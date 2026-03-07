# SocialDukaan Zero-Cost Deployment (No Additional Expense)

This is the best practical path to run full SocialDukaan (Next.js + API routes) with no extra monthly spend.

## 1. Zero-Cost Stack
- App hosting: Vercel Hobby (free)
- Domain DNS: existing Hostinger DNS (no new cost)
- Subdomain: `socialdukaan.rungreen.in` (free)
- Token store: Upstash Redis REST free tier
- Source control + CI: GitHub free

Optional later (if DB features are enabled):
- PostgreSQL: Neon free tier or Supabase free tier

## 2. Why this works
Your app is not static-only. It uses Next API routes under `app/api/*`.
So static shared-hosting subfolder is not enough for real functionality.
Vercel free tier can run Next.js routes without additional hosting expense.

## 3. Preparation
1. Push `E:\VS Code Projects\SocialDukaan` to GitHub (private repo is fine).
2. Keep Node target at 20+ (already in project engines).
3. Confirm `NEXT_PUBLIC_APP_URL` will become `https://socialdukaan.rungreen.in`.

## 4. Deploy on Vercel Free
1. Sign in to Vercel and import the GitHub repository.
2. Framework preset: Next.js (auto-detected).
3. Build command: `npm run build`.
4. Output: default Next.js output (no static export).
5. Deploy.

## 5. Add Environment Variables in Vercel
Set these in Vercel Project Settings -> Environment Variables:

Public/base:
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

Redis REST:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## 6. Free Redis Setup (Upstash)
1. Create free Upstash Redis database.
2. Copy REST URL and token.
3. Add to Vercel env vars as `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

## 7. Connect Subdomain from Hostinger (Free)
In Hostinger DNS Zone for `rungreen.in`:
- Type: `CNAME`
- Name: `socialdukaan`
- Target: `cname.vercel-dns.com`
- TTL: default

In Vercel Domain settings:
- Add domain: `socialdukaan.rungreen.in`
- Wait for verification and SSL issuance.

## 8. OAuth Callback URLs (Critical)
Update callback/redirect URLs in provider dashboards:

Meta:
- `https://socialdukaan.rungreen.in/api/auth/meta/callback`

LinkedIn:
- `https://socialdukaan.rungreen.in/api/auth/linkedin/callback`

Twitter/X:
- `https://socialdukaan.rungreen.in/api/auth/twitter/callback`

## 9. Scheduled Processing with No Extra Cost
Your `vercel.json` has cron config. If your free plan limits cron frequency, fallback to GitHub Actions scheduler:
- Use a cron workflow that calls:
  - `GET https://socialdukaan.rungreen.in/api/autopilot/process`
- GitHub Actions free minutes are usually enough for this trigger pattern.

## 10. Production Verification Checklist
- `https://socialdukaan.rungreen.in` loads
- `https://socialdukaan.rungreen.in/api/health` returns success
- OAuth login callbacks complete successfully
- Upstash keys are valid (no 401 from Redis REST)
- Autopilot process endpoint can be invoked by cron

## 11. Limits You Should Know (Still zero-cost)
- Vercel Hobby has execution/usage limits.
- Free DB/Redis tiers have caps and may throttle or limit storage.
- This is good for MVP, demo, and early users.
- When traffic grows, only then move to paid plans.

## 12. If you want fully free and always-on VM
Alternative: Oracle Cloud Always Free ARM VM + Coolify/Nginx + PM2 (still no monthly cost), but setup complexity is much higher than Vercel.

---
This gives you full functional deployment with no additional monthly spend beyond what you already pay for domain hosting.
