-- Tour Diary Module Migration
-- Creates tables for tour diaries, journeys, and holiday calendar

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tour Diaries table (monthly diary records)
CREATE TABLE IF NOT EXISTS tour_diaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  opening_meter DECIMAL(10,1) NOT NULL DEFAULT 0,
  closing_meter DECIMAL(10,1),
  total_km DECIMAL(10,1) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Completed', 'Submitted', 'Verified')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(officer_id, year, month)
);

-- Tour Journeys table (individual journey records)
CREATE TABLE IF NOT EXISTS tour_journeys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_diary_id UUID NOT NULL REFERENCES tour_diaries(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_date DATE NOT NULL,
  from_place VARCHAR(255) NOT NULL,
  to_place VARCHAR(255) NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  mode VARCHAR(100) NOT NULL DEFAULT 'Car',
  meter_from DECIMAL(10,1) NOT NULL DEFAULT 0,
  distance_km DECIMAL(10,1) NOT NULL DEFAULT 0,
  meter_to DECIMAL(10,1) GENERATED ALWAYS AS (meter_from + distance_km) STORED,
  purpose VARCHAR(255) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holiday Calendar table
CREATE TABLE IF NOT EXISTS holiday_calendar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  holiday_name VARCHAR(255) NOT NULL,
  holiday_type VARCHAR(50) NOT NULL CHECK (holiday_type IN ('GENERAL', 'OPTIONAL', 'WEEKLY')),
  state VARCHAR(100) DEFAULT 'Telangana',
  source_url TEXT DEFAULT 'https://www.telangana.gov.in/downloads/calendar-2026/',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_diaries_officer_year_month ON tour_diaries(officer_id, year, month);
CREATE INDEX IF NOT EXISTS idx_tour_journeys_diary_date ON tour_journeys(tour_diary_id, journey_date);
CREATE INDEX IF NOT EXISTS idx_tour_journeys_officer_date ON tour_journeys(officer_id, journey_date);
CREATE INDEX IF NOT EXISTS idx_holiday_calendar_year_date ON holiday_calendar(year, date);
CREATE INDEX IF NOT EXISTS idx_holiday_calendar_active ON holiday_calendar(active) WHERE active = true;

-- Enable Row Level Security
ALTER TABLE tour_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendar ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_diaries
CREATE POLICY "Officers can view own tour diaries" ON tour_diaries FOR SELECT USING (auth.uid() = officer_id);
CREATE POLICY "Officers can insert own tour diaries" ON tour_diaries FOR INSERT WITH CHECK (auth.uid() = officer_id);
CREATE POLICY "Officers can update own tour diaries" ON tour_diaries FOR UPDATE USING (auth.uid() = officer_id);
CREATE POLICY "Officers can delete own tour diaries" ON tour_diaries FOR DELETE USING (auth.uid() = officer_id);

-- RLS Policies for tour_journeys
CREATE POLICY "Officers can view own tour journeys" ON tour_journeys FOR SELECT USING (auth.uid() = officer_id);
CREATE POLICY "Officers can insert own tour journeys" ON tour_journeys FOR INSERT WITH CHECK (auth.uid() = officer_id);
CREATE POLICY "Officers can update own tour journeys" ON tour_journeys FOR UPDATE USING (auth.uid() = officer_id);
CREATE POLICY "Officers can delete own tour journeys" ON tour_journeys FOR DELETE USING (auth.uid() = officer_id);

-- RLS Policies for holiday_calendar
CREATE POLICY "Anyone can view active holidays" ON holiday_calendar FOR SELECT USING (active = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_tour_diaries_updated_at BEFORE UPDATE ON tour_diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tour_journeys_updated_at BEFORE UPDATE ON tour_journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holiday_calendar_updated_at BEFORE UPDATE ON holiday_calendar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Telangana 2026 holidays
INSERT INTO holiday_calendar (year, date, holiday_name, holiday_type) VALUES
  (2026, '2026-01-01', 'New Year', 'GENERAL'),
  (2026, '2026-01-14', 'Sankranti', 'GENERAL'),
  (2026, '2026-01-15', 'Kanuma', 'GENERAL'),
  (2026, '2026-01-26', 'Republic Day', 'GENERAL'),
  (2026, '2026-03-14', 'Holi', 'GENERAL'),
  (2026, '2026-03-25', 'Ugadi', 'GENERAL'),
  (2026, '2026-03-31', 'Ram Navami', 'GENERAL'),
  (2026, '2026-04-14', 'Dr. B.R. Ambedkar Jayanti', 'GENERAL'),
  (2026, '2026-05-01', 'May Day', 'GENERAL'),
  (2026, '2026-05-25', 'Buddha Purnima', 'GENERAL'),
  (2026, '2026-08-15', 'Independence Day', 'GENERAL'),
  (2026, '2026-08-19', 'Vinayaka Chavithi', 'GENERAL'),
  (2026, '2026-09-14', 'Vinayaka Chavithi', 'GENERAL'),
  (2026, '2026-10-02', 'Gandhi Jayanti', 'GENERAL'),
  (2026, '2026-10-20', 'Dussehra', 'GENERAL'),
  (2026, '2026-10-21', 'Dussehra', 'GENERAL'),
  (2026, '2026-11-04', 'Diwali', 'GENERAL'),
  (2026, '2026-11-05', 'Diwali', 'GENERAL'),
  (2026, '2026-12-25', 'Christmas', 'GENERAL')
ON CONFLICT (year, date) DO NOTHING;
