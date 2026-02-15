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

-- Insert some sample data

-- Sample walks
INSERT INTO bailey_walks (date, duration_minutes, location, notes) VALUES
  ('2026-02-14', 25, 'Neighborhood Loop', 'Beautiful sunset walk'),
  ('2026-02-13', 30, 'Dog Park', 'Met 3 new friends!'),
  ('2026-02-12', 20, 'Neighborhood Loop', 'Quick morning walk'),
  ('2026-02-10', 40, 'Riverside Trail', 'Long adventure, found a stick'),
  ('2026-02-08', 25, 'Neighborhood Loop', NULL);

-- Sample health records
INSERT INTO bailey_health (type, date, title, description, value) VALUES
  ('vet_visit', '2026-01-15', 'Annual Checkup', 'Everything looks great!', NULL),
  ('vaccination', '2026-01-15', 'Rabies Vaccine', 'Good for 3 years', NULL),
  ('weight', '2026-01-15', 'Weight Check', NULL, '52 lbs'),
  ('medication', '2025-12-01', 'Flea & Tick Prevention', 'Monthly dose', NULL),
  ('vet_visit', '2025-06-20', '6-Month Checkup', 'Healthy and happy', NULL);

-- Sample memories
INSERT INTO bailey_memories (type, title, description, date) VALUES
  ('quote', 'The Doorbell Bark', 'Every single time someone rings the doorbell, Bailey thinks she''s protecting us from an invasion. It''s adorable.', '2026-02-01'),
  ('toy', 'Mr. Squeaky', 'Her absolute favorite toy - a yellow duck that''s somehow survived 3 years of intense love.', NULL),
  ('funny_moment', 'The Squirrel Incident', 'Bailey saw a squirrel, forgot she was on a leash, and did a full cartoon-style flip in the air. She was fine, just embarrassed.', '2026-01-20'),
  ('quote', 'Treat Time Dance', 'Bailey does this little spin-jump combo when she knows treats are coming. We call it the Bailey Ballet.', NULL),
  ('toy', 'The Forbidden Ball', 'A tennis ball she stole from the park and guards with her life.', NULL);

-- Sample photos (you'll need to add real URLs after uploading)
INSERT INTO bailey_photos (url, caption, date, is_favorite) VALUES
  ('https://via.placeholder.com/600x400/d4a373/ffffff?text=Bailey+Hero', 'Happy Bailey', '2026-02-14', TRUE),
  ('https://via.placeholder.com/600x400/8b7355/ffffff?text=Bailey+Walk', 'Sunset walk', '2026-02-13', FALSE),
  ('https://via.placeholder.com/600x400/d4a373/ffffff?text=Bailey+Play', 'Playtime!', '2026-02-10', TRUE),
  ('https://via.placeholder.com/600x400/8b7355/ffffff?text=Bailey+Nap', 'Afternoon nap', '2026-02-08', FALSE);

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
