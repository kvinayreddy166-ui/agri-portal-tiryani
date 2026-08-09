-- Fix maize split dosage schedule to match specification
-- Nitrogen: 1/3rd at sowing, 1/3rd at knee-high, 1/3rd at tasseling/flowering
-- Phosphorus: Entire dose at sowing
-- Potash: 1/2 at sowing, 1/2 at tasseling/flowering

-- Update all maize crop recommendations with correct split dosage
update public.crop_fertilizer_recommendations
set split_plan = '[
  {"stage": "Sowing/Basal application", "nPct": 33.33, "pPct": 100, "kPct": 50},
  {"stage": "Knee-high stage", "nPct": 33.33, "pPct": 0, "kPct": 0},
  {"stage": "Tasseling/Flowering stage", "nPct": 33.34, "pPct": 0, "kPct": 50}
]'::jsonb,
updated_at = now()
where crop = 'Maize';

-- This will update all maize varieties (Kharif and Yasangi seasons)
