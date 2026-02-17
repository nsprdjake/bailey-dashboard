-- Veterinary Records Management Schema

-- Create Vet Records table
CREATE TABLE IF NOT EXISTS bailey_vet_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('vaccine', 'visit', 'surgery', 'medication', 'lab_work', 'other')),
  title TEXT NOT NULL, -- e.g. "Annual Checkup", "Rabies Vaccine"
  description TEXT,
  vet_name TEXT, -- Clinic or Doctor name
  cost NUMERIC(10, 2),
  next_due_date DATE, -- For vaccines or follow-ups
  file_url TEXT, -- Link to uploaded document/invoice
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Medications table
CREATE TABLE IF NOT EXISTS bailey_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL, -- e.g. "10mg"
  frequency TEXT NOT NULL, -- e.g. "Twice daily", "Monthly"
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if ongoing
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vet_records_date ON bailey_vet_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_vet_records_type ON bailey_vet_records(type);
CREATE INDEX IF NOT EXISTS idx_medications_active ON bailey_medications(active);

-- RLS
ALTER TABLE bailey_vet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_medications ENABLE ROW LEVEL SECURITY;

-- Policies (Public access for now, similar to existing setup)
CREATE POLICY "Public read access" ON bailey_vet_records FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_vet_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_vet_records FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_vet_records FOR DELETE USING (true);

CREATE POLICY "Public read access" ON bailey_medications FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_medications FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_medications FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_medications FOR DELETE USING (true);

-- Sample Data
INSERT INTO bailey_vet_records (date, type, title, description, vet_name, next_due_date) VALUES
  ('2025-06-15', 'vaccine', 'Rabies (3-year)', 'Administered 3-year rabies booster', 'Dr. Smith', '2028-06-15'),
  ('2025-06-15', 'visit', 'Annual Wellness Exam', 'Healthy weight, clean teeth', 'Dr. Smith', '2026-06-15'),
  ('2025-12-01', 'visit', 'Ear Infection Check', 'Prescribed drops for left ear', 'Dr. Jones', NULL);

INSERT INTO bailey_medications (name, dosage, frequency, start_date, active) VALUES
  ('Heartgard Plus', 'Green Box (25-50lbs)', 'Monthly', '2023-01-01', TRUE),
  ('NexGard', 'Large Dog', 'Monthly', '2023-01-01', TRUE);

-- Create Weight Logs table
CREATE TABLE IF NOT EXISTS bailey_weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  weight_lbs NUMERIC(5, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Weight Logs
CREATE INDEX IF NOT EXISTS idx_weight_logs_date ON bailey_weight_logs(date DESC);

-- RLS for Weight Logs
ALTER TABLE bailey_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON bailey_weight_logs FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON bailey_weight_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON bailey_weight_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON bailey_weight_logs FOR DELETE USING (true);

-- Sample Weight Data
INSERT INTO bailey_weight_logs (date, weight_lbs) VALUES
  ('2026-01-15', 52.0),
  ('2025-06-20', 50.5),
  ('2025-01-10', 48.0);

