-- ReviewLens Database Schema for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'agency')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apps table
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  app_id TEXT NOT NULL,
  country TEXT DEFAULT 'us',
  name TEXT NOT NULL,
  developer TEXT,
  icon_url TEXT,
  category TEXT,
  current_rating DECIMAL(2, 1),
  rating_count INTEGER,
  current_version TEXT,
  description TEXT,
  app_url TEXT NOT NULL,
  is_competitor BOOLEAN DEFAULT false,
  parent_app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform, app_id, country)
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  review_id TEXT,
  title TEXT,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  author_name TEXT,
  author_url TEXT,
  app_version TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  helpful_count INTEGER DEFAULT 0,
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3, 2),
  sentiment_magnitude DECIMAL(3, 2),
  ai_analyzed BOOLEAN DEFAULT false,
  ai_themes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, review_id)
);

-- Insights table
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('complaints', 'praise', 'summary', 'trends')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('rating_drop', 'keyword_spike', 'review_spike', 'sentiment_change')),
  condition JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT true,
  notify_in_app BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert notifications table
CREATE TABLE alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  app_id UUID REFERENCES apps(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  title TEXT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  pdf_url TEXT,
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics snapshots table (for trending over time)
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  average_rating DECIMAL(2, 1),
  total_reviews INTEGER,
  new_reviews_count INTEGER,
  sentiment_positive INTEGER,
  sentiment_neutral INTEGER,
  sentiment_negative INTEGER,
  rating_1_star INTEGER,
  rating_2_star INTEGER,
  rating_3_star INTEGER,
  rating_4_star INTEGER,
  rating_5_star INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(app_id, date)
);

-- Indexes for performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_apps_user_id ON apps(user_id);
CREATE INDEX idx_reviews_app_id ON reviews(app_id);
CREATE INDEX idx_reviews_date ON reviews(date DESC);
CREATE INDEX idx_reviews_sentiment ON reviews(sentiment_label);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_insights_app_id ON insights(app_id);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_analytics_snapshots_app_date ON analytics_snapshots(app_id, date DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON users FOR ALL USING (clerk_id = current_setting('app.clerk_id', true));

-- Apps policies
CREATE POLICY apps_select_policy ON apps FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));
CREATE POLICY apps_insert_policy ON apps FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));
CREATE POLICY apps_update_policy ON apps FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));
CREATE POLICY apps_delete_policy ON apps FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));

-- Reviews policies (can see reviews for their apps)
CREATE POLICY reviews_select_policy ON reviews FOR SELECT USING (app_id IN (SELECT id FROM apps WHERE user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true))));

-- Insights policies
CREATE POLICY insights_select_policy ON insights FOR SELECT USING (app_id IN (SELECT id FROM apps WHERE user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true))));

-- Alerts policies
CREATE POLICY alerts_policy ON alerts FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));

-- Alert notifications policies
CREATE POLICY alert_notifications_select_policy ON alert_notifications FOR SELECT USING (alert_id IN (SELECT id FROM alerts WHERE user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true))));

-- Reports policies
CREATE POLICY reports_select_policy ON reports FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)) OR is_public = true);
CREATE POLICY reports_insert_policy ON reports FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));
CREATE POLICY reports_update_policy ON reports FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));
CREATE POLICY reports_delete_policy ON reports FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true)));

-- Analytics snapshots policies
CREATE POLICY analytics_snapshots_select_policy ON analytics_snapshots FOR SELECT USING (app_id IN (SELECT id FROM apps WHERE user_id IN (SELECT id FROM users WHERE clerk_id = current_setting('app.clerk_id', true))));

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON apps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
