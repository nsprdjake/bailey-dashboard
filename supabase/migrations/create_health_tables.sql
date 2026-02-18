-- Bailey Health Tables Migration
-- Run this in the Supabase SQL editor: https://supabase.com/dashboard/project/kxqrsdicrayblwpczxsy/editor

CREATE TABLE IF NOT EXISTS bailey_vet_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'visit' CHECK (type IN ('vaccine', 'visit', 'surgery', 'medication', 'lab_work', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  vet_name TEXT,
  cost DECIMAL(10,2),
  next_due_date DATE,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bailey_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bailey_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  weight_lbs DECIMAL(5,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE bailey_vet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_weight_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (tighten later)
CREATE POLICY "Allow all" ON bailey_vet_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_medications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_weight_logs FOR ALL USING (true) WITH CHECK (true);
