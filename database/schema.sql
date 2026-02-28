-- AutoMark Database Schema (Supabase/PostgreSQL)
-- Run in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('mobile_app', 'ecommerce')),
    description TEXT,
    product_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitors table
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram')),
    handle TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_competitors_platform ON competitors(platform);

-- Raw scraped data
CREATE TABLE raw_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram')),
    post_text TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    posted_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_raw_data_competitor ON raw_data(competitor_id);
CREATE INDEX idx_raw_data_scraped ON raw_data(scraped_at DESC);

-- Competitor insights (AI-generated)
CREATE TABLE competitor_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    top_hooks JSONB DEFAULT '[]',
    trending_topics JSONB DEFAULT '[]',
    best_content_types JSONB DEFAULT '[]',
    peak_posting_times JSONB DEFAULT '[]',
    opportunity_gaps JSONB DEFAULT '[]',
    raw_claude_response TEXT
);
CREATE INDEX idx_insights_date ON competitor_insights(generated_at DESC);

-- Content queue
CREATE TABLE content_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id),
    platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'reddit', 'instagram')),
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'thread', 'carousel', 'question', 'data')),
    scheduled_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'failed', 'retry')),
    buffer_post_id TEXT,
    posted_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    campaign_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_content_status ON content_queue(status);
CREATE INDEX idx_content_scheduled ON content_queue(scheduled_time);
CREATE INDEX idx_content_platform ON content_queue(platform);

-- Post performance metrics
CREATE TABLE post_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_queue_id UUID REFERENCES content_queue(id) ON DELETE CASCADE,
    impressions INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    pulled_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_perf_content ON post_performance(content_queue_id);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal TEXT,
    key_message TEXT,
    product_link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from content_queue to campaigns
ALTER TABLE content_queue ADD CONSTRAINT fk_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_competitors_updated BEFORE UPDATE ON competitors FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_content_updated BEFORE UPDATE ON content_queue FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER trg_campaigns_updated BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;