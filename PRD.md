# AutoMark - Autonomous AI Marketing Platform
# PRD v1.0.0 | Feb 2026

## Core Promise
Zero manual effort. AI researches, writes, schedules, and optimizes all content.

## Target Platforms
Twitter/X, LinkedIn, Instagram/Facebook, Reddit

## Tech Stack (Free Tier)
- n8n (self-hosted on Railway) - automation engine
- Claude API (Haiku) - AI content generation (~$1-3/mo)
- Buffer (free) - social scheduling (3 channels, 10 posts each)
- Supabase - PostgreSQL database (500MB free)
- Apify - social media scraping ($5/mo free credit)
- Railway.app - host n8n (500 hours free/mo)
- Resend - transactional email (100/day free)
- Reddit API - direct posting (60 req/min)
- Meta Graph API - Instagram posting

## 5 Core Workflows (n8n)
1. Daily Competitor Research (6AM) - Apify scrape → Claude analysis → Supabase
2. Weekly Content Generation (Sunday 7PM) - 56 posts/week across 4 platforms
3. Auto-Posting (every 30min) - Buffer API + Reddit API
4. Performance Tracking (10PM daily) - pull engagement metrics
5. Monthly Report (1st of month) - aggregated analytics + AI narrative

## Database Tables
- products, competitors, raw_data, competitor_insights, content_queue, post_performance

## Key Metrics
- 10+ posts/week, 3-5 competitors scanned daily, >2% engagement rate
- 10% WoW reach growth within 60 days
- Total cost under $3/month