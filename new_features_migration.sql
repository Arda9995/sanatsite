-- Migration script for new features

-- 1. Orders table updates
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_viewed_by_admin BOOLEAN DEFAULT FALSE;

-- 2. Artists and Artist Applications updates
ALTER TABLE artists ADD COLUMN IF NOT EXISTS portfolio_file_url TEXT;
ALTER TABLE artist_applications ADD COLUMN IF NOT EXISTS portfolio_file_url TEXT;

-- 3. Artwork Metrics table (specific metrics for individual artworks)
CREATE TABLE IF NOT EXISTS artwork_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country TEXT NOT NULL,
    area TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Artworks and Artwork Submissions updates (JSONB backup fields if needed, but the primary table is artwork_metrics)
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS custom_metrics JSONB DEFAULT '{}'::jsonb;
ALTER TABLE artwork_submissions ADD COLUMN IF NOT EXISTS custom_metrics JSONB DEFAULT '{}'::jsonb;

-- Enable RLS and add basic policies
ALTER TABLE artwork_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- Simple policies - Adjust as needed for specific security requirements
-- Admin only for all write/delete operations
CREATE POLICY "Admins can do everything on artwork_metrics" ON artwork_metrics FOR ALL USING (
    (auth.jwt() ->> 'email' = 'ardaonuk9995@gmail.com') OR 
    (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
);
CREATE POLICY "Admins can do everything on blacklist" ON blacklist FOR ALL USING (
    (auth.jwt() ->> 'email' = 'ardaonuk9995@gmail.com') OR 
    (EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid()))
);

-- Public/Authenticated read access
CREATE POLICY "Anyone can read artwork_metrics" ON artwork_metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can read blacklist" ON blacklist FOR SELECT USING (true);
