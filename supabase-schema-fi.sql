-- Bailey Dashboard - Fi Collar Integration Schema Enhancement
-- Run this AFTER the base schema (supabase-schema.sql)

-- Add Fi collar activity fields to bailey_walks table
ALTER TABLE bailey_walks
ADD COLUMN IF NOT EXISTS fi_walk_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS steps INTEGER,
ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS avg_speed_mph NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS synced_from_fi BOOLEAN DEFAULT FALSE;

-- Create Fi activity table for daily summaries
CREATE TABLE IF NOT EXISTS bailey_fi_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_steps INTEGER NOT NULL DEFAULT 0,
  total_distance_meters NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_calories INTEGER NOT NULL DEFAULT 0,
  walk_count INTEGER NOT NULL DEFAULT 0,
  rest_minutes INTEGER NOT NULL DEFAULT 0,
  nap_minutes INTEGER NOT NULL DEFAULT 0,
  active_minutes INTEGER NOT NULL DEFAULT 0,
  play_minutes INTEGER NOT NULL DEFAULT 0,
  daily_goal_steps INTEGER DEFAULT 10000,
  goal_achieved BOOLEAN DEFAULT FALSE,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fi locations table for GPS tracking
CREATE TABLE IF NOT EXISTS bailey_fi_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  walk_id UUID REFERENCES bailey_walks(id) ON DELETE CASCADE,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  accuracy_meters NUMERIC(6,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fi sleep tracking table
CREATE TABLE IF NOT EXISTS bailey_fi_sleep (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  sleep_type TEXT NOT NULL CHECK (sleep_type IN ('nap', 'rest', 'deep_sleep')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Fi sync log table to track sync history
CREATE TABLE IF NOT EXISTS bailey_fi_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('manual', 'auto', 'cron')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fi_activity_date ON bailey_fi_activity(date DESC);
CREATE INDEX IF NOT EXISTS idx_fi_locations_walk ON bailey_fi_locations(walk_id);
CREATE INDEX IF NOT EXISTS idx_fi_locations_timestamp ON bailey_fi_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fi_sleep_date ON bailey_fi_sleep(date DESC);
CREATE INDEX IF NOT EXISTS idx_walks_fi_id ON bailey_walks(fi_walk_id);
CREATE INDEX IF NOT EXISTS idx_walks_start_time ON bailey_walks(start_time DESC);

-- Enable Row Level Security on new tables
ALTER TABLE bailey_fi_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_fi_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_fi_sleep ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_fi_sync_log ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed)
CREATE POLICY "Public read access" ON bailey_fi_activity FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_fi_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_fi_activity FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_fi_activity FOR DELETE USING (true);

CREATE POLICY "Public read access" ON bailey_fi_locations FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_fi_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_fi_locations FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_fi_locations FOR DELETE USING (true);

CREATE POLICY "Public read access" ON bailey_fi_sleep FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_fi_sleep FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_fi_sleep FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_fi_sleep FOR DELETE USING (true);

CREATE POLICY "Public read access" ON bailey_fi_sync_log FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_fi_sync_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_fi_sync_log FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_fi_sync_log FOR DELETE USING (true);

-- Insert sample Fi activity data for testing
INSERT INTO bailey_fi_activity (date, total_steps, total_distance_meters, total_calories, walk_count, rest_minutes, nap_minutes, active_minutes, daily_goal_steps, goal_achieved) VALUES
  ('2026-02-14', 8542, 6234.5, 456, 3, 720, 180, 245, 10000, FALSE),
  ('2026-02-13', 12340, 9012.3, 621, 4, 650, 150, 320, 10000, TRUE),
  ('2026-02-12', 7234, 5123.8, 389, 2, 780, 200, 198, 10000, FALSE),
  ('2026-02-11', 11567, 8456.2, 578, 5, 690, 160, 285, 10000, TRUE),
  ('2026-02-10', 9876, 7234.1, 498, 3, 710, 170, 256, 10000, FALSE)
ON CONFLICT (date) DO NOTHING;

-- Insert sample sleep data
INSERT INTO bailey_fi_sleep (date, sleep_type, start_time, end_time, duration_minutes, quality_score) VALUES
  ('2026-02-14', 'nap', '2026-02-14 14:30:00+00', '2026-02-14 16:45:00+00', 135, 8),
  ('2026-02-14', 'rest', '2026-02-14 22:00:00+00', '2026-02-15 06:30:00+00', 510, 9),
  ('2026-02-13', 'nap', '2026-02-13 13:15:00+00', '2026-02-13 15:00:00+00', 105, 7),
  ('2026-02-13', 'rest', '2026-02-13 21:45:00+00', '2026-02-14 06:15:00+00', 510, 8),
  ('2026-02-12', 'nap', '2026-02-12 15:00:00+00', '2026-02-12 17:20:00+00', 140, 9)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE bailey_fi_activity IS 'Daily activity summaries from Fi collar';
COMMENT ON TABLE bailey_fi_locations IS 'GPS location data from Fi collar walks';
COMMENT ON TABLE bailey_fi_sleep IS 'Sleep and rest tracking from Fi collar';
COMMENT ON TABLE bailey_fi_sync_log IS 'Fi API sync history and status';
