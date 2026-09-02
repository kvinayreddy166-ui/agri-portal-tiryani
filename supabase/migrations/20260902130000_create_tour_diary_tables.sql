-- Create tour_diaries table
CREATE TABLE IF NOT EXISTS public.tour_diaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  opening_meter NUMERIC DEFAULT 0,
  closing_meter NUMERIC,
  total_km NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted')),
  officer_name TEXT,
  designation TEXT,
  district TEXT,
  mandal TEXT,
  division TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(officer_id, year, month)
);

-- Create tour_journeys table
CREATE TABLE IF NOT EXISTS public.tour_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_diary_id UUID NOT NULL REFERENCES public.tour_diaries(id) ON DELETE CASCADE,
  officer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_date DATE NOT NULL,
  from_place TEXT NOT NULL,
  to_place TEXT NOT NULL,
  time_from TIME NOT NULL,
  time_to TIME NOT NULL,
  mode VARCHAR(100) NOT NULL,
  meter_from NUMERIC DEFAULT 0,
  distance_km NUMERIC DEFAULT 0,
  meter_to NUMERIC DEFAULT 0,
  purpose TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create holiday_calendar table
CREATE TABLE IF NOT EXISTS public.holiday_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  holiday_name TEXT NOT NULL,
  holiday_type VARCHAR(50) NOT NULL CHECK (holiday_type IN ('GENERAL', 'OPTIONAL')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(year, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tour_diaries_officer_year_month ON public.tour_diaries(officer_id, year, month);
CREATE INDEX IF NOT EXISTS idx_tour_journeys_diary_id ON public.tour_journeys(tour_diary_id);
CREATE INDEX IF NOT EXISTS idx_tour_journeys_officer_date ON public.tour_journeys(officer_id, journey_date);
CREATE INDEX IF NOT EXISTS idx_holiday_calendar_year ON public.holiday_calendar(year);

-- Enable Row Level Security
ALTER TABLE public.tour_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holiday_calendar ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tour_diaries
CREATE POLICY "Users can view their own tour diaries"
  ON public.tour_diaries FOR SELECT
  USING (auth.uid() = officer_id);

CREATE POLICY "Users can insert their own tour diaries"
  ON public.tour_diaries FOR INSERT
  WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Users can update their own tour diaries"
  ON public.tour_diaries FOR UPDATE
  USING (auth.uid() = officer_id);

CREATE POLICY "Users can delete their own tour diaries"
  ON public.tour_diaries FOR DELETE
  USING (auth.uid() = officer_id);

-- Create RLS policies for tour_journeys
CREATE POLICY "Users can view their own tour journeys"
  ON public.tour_journeys FOR SELECT
  USING (auth.uid() = officer_id);

CREATE POLICY "Users can insert their own tour journeys"
  ON public.tour_journeys FOR INSERT
  WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Users can update their own tour journeys"
  ON public.tour_journeys FOR UPDATE
  USING (auth.uid() = officer_id);

CREATE POLICY "Users can delete their own tour journeys"
  ON public.tour_journeys FOR DELETE
  USING (auth.uid() = officer_id);

-- Create RLS policies for holiday_calendar (public read, authenticated write)
CREATE POLICY "Anyone can view active holidays"
  ON public.holiday_calendar FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can insert holidays"
  ON public.holiday_calendar FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update holidays"
  ON public.holiday_calendar FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete holidays"
  ON public.holiday_calendar FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS handle_updated_at_tour_diaries ON public.tour_diaries;
CREATE TRIGGER handle_updated_at_tour_diaries
  BEFORE UPDATE ON public.tour_diaries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_tour_journeys ON public.tour_journeys;
CREATE TRIGGER handle_updated_at_tour_journeys
  BEFORE UPDATE ON public.tour_journeys
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at_holiday_calendar ON public.holiday_calendar;
CREATE TRIGGER handle_updated_at_holiday_calendar
  BEFORE UPDATE ON public.holiday_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
