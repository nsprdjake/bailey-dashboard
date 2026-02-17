-- Bailey Health Dashboard Database Schema
-- Created: 2026-02-17

-- Bailey Profile Table (static info)
CREATE TABLE IF NOT EXISTS bailey_profile (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) DEFAULT 'Bailey',
  birth_date DATE DEFAULT '2021-02-01', -- Approximate, she's 5 years old
  breed VARCHAR(100),
  weight_lbs DECIMAL(5,2) DEFAULT 50.0,
  microchip_number VARCHAR(50),
  insurance_info TEXT,
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Bailey's profile
INSERT INTO bailey_profile (name, notes) 
VALUES ('Bailey', 'Jake''s 5-year-old dog. Mix of Ollie subscription and Rachel Ray kibble diet.')
ON CONFLICT DO NOTHING;

-- Daily Activities Table
CREATE TABLE IF NOT EXISTS bailey_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activity_type VARCHAR(50) NOT NULL, -- walk, meal, bathroom, play, training
  duration_minutes INTEGER,
  distance_miles DECIMAL(4,2),
  notes TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_activities_date ON bailey_activities(date DESC);
CREATE INDEX idx_bailey_activities_type ON bailey_activities(activity_type);

-- Meals Tracking Table
CREATE TABLE IF NOT EXISTS bailey_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meal_type VARCHAR(20) NOT NULL, -- breakfast, dinner, snack
  food_type VARCHAR(50), -- Ollie, Rachel Ray kibble, treat
  amount VARCHAR(50), -- e.g., "1 cup", "1/2 pouch"
  appetite_score INTEGER CHECK (appetite_score >= 1 AND appetite_score <= 5),
  finished_meal BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_meals_date ON bailey_meals(date DESC);

-- Health Symptoms Table
CREATE TABLE IF NOT EXISTS bailey_symptoms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  symptom_type VARCHAR(100) NOT NULL, -- ear_shaking, limping, scratching, lethargy, etc.
  affected_area VARCHAR(100), -- right_ear, left_hind_leg, etc.
  severity INTEGER CHECK (severity >= 1 AND severity <= 10),
  duration VARCHAR(50), -- "few minutes", "all day", "intermittent"
  trigger VARCHAR(200), -- what might have caused it
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_symptoms_date ON bailey_symptoms(date DESC);
CREATE INDEX idx_bailey_symptoms_type ON bailey_symptoms(symptom_type);

-- Medications Table
CREATE TABLE IF NOT EXISTS bailey_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_name VARCHAR(100) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100), -- "twice daily", "once daily", "as needed"
  prescribed_date DATE,
  prescribed_by VARCHAR(100),
  condition_treated VARCHAR(200),
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication Administration Log
CREATE TABLE IF NOT EXISTS bailey_medication_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID REFERENCES bailey_medications(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  given BOOLEAN DEFAULT TRUE,
  skipped_reason VARCHAR(200),
  effectiveness INTEGER CHECK (effectiveness >= 1 AND effectiveness <= 5),
  side_effects TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_medication_log_date ON bailey_medication_log(date DESC);

-- Vet Appointments Table
CREATE TABLE IF NOT EXISTS bailey_vet_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  vet_name VARCHAR(100),
  clinic_name VARCHAR(100),
  appointment_type VARCHAR(100), -- checkup, vaccination, emergency, follow-up, etc.
  reason VARCHAR(500),
  findings TEXT,
  recommendations TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_vet_appointments_date ON bailey_vet_appointments(appointment_date DESC);

-- Weight Tracking Table
CREATE TABLE IF NOT EXISTS bailey_weight (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_lbs DECIMAL(5,2) NOT NULL,
  weight_kg DECIMAL(5,2) GENERATED ALWAYS AS (weight_lbs * 0.453592) STORED,
  body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 9),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bailey_weight_date ON bailey_weight(date DESC);

-- Vaccinations Table
CREATE TABLE IF NOT EXISTS bailey_vaccinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vaccine_name VARCHAR(100) NOT NULL,
  date_given DATE NOT NULL,
  next_due_date DATE,
  vet_name VARCHAR(100),
  clinic_name VARCHAR(100),
  lot_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Results Table
CREATE TABLE IF NOT EXISTS bailey_lab_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_date DATE NOT NULL,
  test_type VARCHAR(100), -- blood work, urinalysis, fecal, cytology, etc.
  results TEXT,
  normal_ranges TEXT,
  abnormal_findings TEXT,
  vet_interpretation TEXT,
  follow_up_needed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS bailey_emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_type VARCHAR(50) NOT NULL, -- primary_vet, emergency_clinic, poison_control
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  hours TEXT,
  notes TEXT,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert upcoming appointments
INSERT INTO bailey_vet_appointments (appointment_date, appointment_time, appointment_type, reason, notes)
VALUES 
  ('2026-03-09', '08:30:00', 'diagnostic', 'Radiographs (X-rays) for left hind leg lameness', 'Check for possible cruciate ligament issue'),
  ('2026-03-09', '15:00:00', 'follow-up', 'Ear infection recheck', 'Follow-up after Duotic treatment');

-- Insert current medications
INSERT INTO bailey_medications (medication_name, dosage, frequency, prescribed_date, condition_treated, start_date, active, notes)
VALUES 
  ('Apoquel', 'As prescribed', 'Twice daily for 2 weeks, then once daily', '2026-02-02', 'Ear inflammation and allergies', '2026-02-02', true, 'Can be obtained via prescription from Chewy or Costco'),
  ('Duotic', 'Applied at vet', 'Two applications, one week apart', '2026-02-02', 'Right ear yeast infection', '2026-02-02', true, 'First dose applied at vet, second dose due around Feb 9');

-- Insert recent weight
INSERT INTO bailey_weight (date, weight_lbs, notes)
VALUES ('2026-02-02', 49.8, 'Measured at vet visit (24.9 kg)');

-- Views for quick stats
CREATE OR REPLACE VIEW bailey_daily_summary AS
SELECT 
  d.date,
  (SELECT COUNT(*) FROM bailey_activities WHERE date = d.date AND activity_type = 'walk') as walks_count,
  (SELECT SUM(duration_minutes) FROM bailey_activities WHERE date = d.date AND activity_type = 'walk') as total_walk_minutes,
  (SELECT COUNT(*) FROM bailey_meals WHERE date = d.date) as meals_count,
  (SELECT COUNT(*) FROM bailey_medication_log WHERE date = d.date AND given = true) as medications_given,
  (SELECT COUNT(*) FROM bailey_symptoms WHERE date = d.date) as symptoms_reported,
  (SELECT MAX(severity) FROM bailey_symptoms WHERE date = d.date) as max_symptom_severity
FROM (
  SELECT DISTINCT date FROM (
    SELECT date FROM bailey_activities
    UNION SELECT date FROM bailey_meals
    UNION SELECT date FROM bailey_medication_log
    UNION SELECT date FROM bailey_symptoms
  ) all_dates
) d
ORDER BY d.date DESC;

-- Medication adherence view
CREATE OR REPLACE VIEW bailey_medication_adherence AS
WITH expected_doses AS (
  SELECT 
    m.id,
    m.medication_name,
    d.date,
    CASE 
      WHEN m.frequency LIKE '%twice%' THEN 2
      WHEN m.frequency LIKE '%once%' THEN 1
      ELSE 1
    END as daily_doses
  FROM bailey_medications m
  CROSS JOIN LATERAL (
    SELECT generate_series(
      GREATEST(m.start_date, CURRENT_DATE - INTERVAL '30 days'),
      LEAST(COALESCE(m.end_date, CURRENT_DATE), CURRENT_DATE),
      '1 day'::interval
    )::date as date
  ) d
  WHERE m.active = true
)
SELECT 
  e.medication_name,
  COUNT(DISTINCT e.date) as days_expected,
  COUNT(DISTINCT l.date) as days_given,
  ROUND(100.0 * COUNT(DISTINCT l.date) / NULLIF(COUNT(DISTINCT e.date), 0), 1) as adherence_percentage
FROM expected_doses e
LEFT JOIN bailey_medication_log l ON e.id = l.medication_id AND e.date = l.date AND l.given = true
GROUP BY e.medication_name;

-- Enable Row Level Security
ALTER TABLE bailey_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_medication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_vet_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE bailey_emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for single-user dashboard)
CREATE POLICY "Allow all" ON bailey_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_meals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_symptoms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_medications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_medication_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_vet_appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_weight FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_vaccinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_lab_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON bailey_emergency_contacts FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_bailey_profile_updated_at BEFORE UPDATE ON bailey_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bailey_medications_updated_at BEFORE UPDATE ON bailey_medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bailey_vet_appointments_updated_at BEFORE UPDATE ON bailey_vet_appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bailey_emergency_contacts_updated_at BEFORE UPDATE ON bailey_emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();