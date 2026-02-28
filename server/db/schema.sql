-- Schema for AutoMark Database

-- Content Queue Table
CREATE TABLE content_queue (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Competitor Insights Table
CREATE TABLE competitor_insights (
  id SERIAL PRIMARY KEY,
  insight TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Performance Table
CREATE TABLE post_performance (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50),
  impressions INT,
  clicks INT,
  engagement_rate VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Engagement Metrics Table
CREATE TABLE engagement_metrics (
  id SERIAL PRIMARY KEY,
  total_engagements INT,
  top_platform VARCHAR(50),
  average_engagement_rate VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns Table
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  platforms TEXT[],
  budget NUMERIC(10, 2),
  start_date DATE,
  end_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Raw Data Table
CREATE TABLE raw_data (
  id SERIAL PRIMARY KEY,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security Policies
-- Enable RLS on all tables, to be defined later based on application needs
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data ENABLE ROW LEVEL SECURITY;