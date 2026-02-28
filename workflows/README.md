# AutoMark n8n Workflows

## Workflow 1: Daily Competitor Research
**Schedule:** 6:00 AM daily
**Nodes:**
1. Cron Trigger → 6:00 AM
2. Supabase → Fetch active competitors
3. Loop → For each competitor:
   a. HTTP Request → Apify API (run twitter/instagram scraper)
   b. Wait → Poll run status (5s intervals, max 2min)
   c. HTTP Request → Fetch scrape results
   d. Supabase → Insert raw posts into raw_data
4. Function → Aggregate all posts by platform
5. HTTP Request → Claude API (analyze posts, extract insights)
6. Supabase → Save insights to competitor_insights
7. HTTP Request → Resend (email summary report)
**Error Handling:** 3 retries per scrape, skip failed competitors, continue pipeline

## Workflow 2: Weekly Content Generation
**Schedule:** Sunday 7:00 PM
**Nodes:**
1. Cron Trigger → Sunday 19:00
2. Supabase → Fetch latest competitor_insights
3. Supabase → Fetch top 10 posts by engagement from post_performance
4. Function → Build context (insights + top posts + product info)
5. HTTP Request → Claude API (generate 56 posts JSON)
6. Loop → For each post:
   a. Supabase → Insert into content_queue (status: approved, scheduled_time calculated)
7. HTTP Request → Resend (email draft summary)
**Error Handling:** If Claude fails, copy last week's top 10 posts as templates

## Workflow 3: Auto-Posting
**Schedule:** Every 30 minutes
**Nodes:**
1. Cron Trigger → */30 * * * *
2. Supabase → Query content_queue WHERE scheduled_time <= NOW AND status = 'approved'
3. Switch → Route by platform
4a. Twitter → HTTP Request → Buffer API
4b. LinkedIn → HTTP Request → Buffer API
4c. Instagram → HTTP Request → Buffer API
4d. Reddit → HTTP Request → Reddit API (direct)
5. Supabase → Update status to 'posted' or 'failed'
6. If Failed → Increment retry_count, set status 'retry' if count < 3
**Error Handling:** Max 3 retries with 30min backoff, alert email on 3rd failure

## Workflow 4: Performance Tracking
**Schedule:** 10:00 PM daily
**Nodes:**
1. Cron Trigger → 22:00
2. Supabase → Fetch posts with status 'posted' from 24h ago
3. Loop → For each post:
   a. Switch by platform → call respective API for metrics
   b. Function → Calculate engagement_rate
   c. Supabase → Insert into post_performance
4. Function → Calculate daily averages
5. Supabase → Update weekly top performers

## Workflow 5: Monthly Report
**Schedule:** 1st of month, 9:00 AM
**Nodes:**
1. Cron Trigger → 1st, 09:00
2. Supabase → Aggregate all metrics for previous month
3. HTTP Request → Claude API (generate narrative report)
4. Function → Build HTML report
5. HTTP Request → Resend (email HTML report)