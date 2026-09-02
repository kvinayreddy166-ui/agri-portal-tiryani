-- Add officer fields to tour_diaries table
ALTER TABLE tour_diaries ADD COLUMN IF NOT EXISTS officer_name VARCHAR(255);
ALTER TABLE tour_diaries ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
ALTER TABLE tour_diaries ADD COLUMN IF NOT EXISTS district VARCHAR(255);
ALTER TABLE tour_diaries ADD COLUMN IF NOT EXISTS mandal VARCHAR(255);
