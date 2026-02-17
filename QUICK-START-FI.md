# Quick Start - Bailey Fi Integration

## 1. Apply Database Schemas (MUST DO FIRST)

Go to: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/sql/new

### Step 1: Copy and run this entire block:
```sql
-- Bailey Dashboard Database Schema
-- Run this in your Supabase SQL editor

-- Walks table
CREATE TABLE IF NOT EXISTS bailey_walks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health records table
CREATE TABLE IF NOT EXISTS bailey_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('vet_visit', 'vaccination', 'medication', 'weight')),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  value TEXT, -- For weight tracking, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS bailey_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  date DATE NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memories table
CREATE TABLE IF NOT EXISTS bailey_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('quote', 'toy', 'funny_moment')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE bailey_walks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_memories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed)
CREATE POLICY "Public read access" ON bailey_walks FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bailey_health FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bailey_photos FOR SELECT USING (true);
CREATE POLICY "Public read access" ON bailey_memories FOR SELECT USING (true);

-- For insert/update, you'll want to add authentication
-- For now, allowing all (you can restrict this later)
CREATE POLICY "Public insert access" ON bailey_walks FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON bailey_health FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON bailey_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON bailey_memories FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON bailey_walks FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON bailey_health FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON bailey_photos FOR UPDATE USING (true);
CREATE POLICY "Public update access" ON bailey_memories FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON bailey_walks FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON bailey_health FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON bailey_photos FOR DELETE USING (true);
CREATE POLICY "Public delete access" ON bailey_memories FOR DELETE USING (true);
```

### Step 2: Copy and run this entire block:
```sql
-- Bailey Dashboard - Fi Collar Integration Schema Enhancement

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
```

## 2. Run Initial Sync

```bash
cd bailey-dashboard
source venv/bin/activate
python3 fi-sync-working.py
```

## 3. Set Up Daily Cron Job

```bash
# Edit crontab
crontab -e

# Add this line:
0 6 * * * /Users/jack/.openclaw/workspace/bailey-dashboard/fi-sync-cron.sh >> /Users/jack/.openclaw/workspace/bailey-dashboard/logs/fi-sync.log 2>&1
```

## 4. Start Dashboard

```bash
cd bailey-dashboard
npm run dev
```

Then visit: http://localhost:3000/activity

## Test Commands

```bash
# Test Fi connection
cd bailey-dashboard && source venv/bin/activate && python3 fi-sync-simple.py

# Dry run sync
cd bailey-dashboard && source venv/bin/activate && python3 fi-sync-working.py --dry-run

# Check logs
tail -f bailey-dashboard/logs/fi-sync.log
```