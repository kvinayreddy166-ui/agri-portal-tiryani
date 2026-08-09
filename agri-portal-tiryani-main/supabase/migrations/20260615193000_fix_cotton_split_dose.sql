-- Fix cotton fertilizer split dose plans
-- Cotton Normal Variety: 36:18:18 with 3 equal splits at 30, 60, 90 DAS
update public.crop_fertilizer_recommendations
set n = 36, p = 18, k = 18,
    split_plan = '[
      {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0, "notes": "Apply entire phosphorus dose before ploughing/basal"},
      {"stage": "30 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
      {"stage": "60 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
      {"stage": "90 DAS", "nPct": 33.34, "pPct": 0, "kPct": 33.34}
    ]'::jsonb,
    updated_at = now()
where crop_name = 'Cotton' and variety = 'Normal';

-- Cotton Hybrid: 48:24:24 with 4 equal splits at 20, 40, 60, 80 DAS
update public.crop_fertilizer_recommendations
set n = 48, p = 24, k = 24,
    split_plan = '[
      {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0, "notes": "Apply entire phosphorus dose before ploughing/basal"},
      {"stage": "20 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "40 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "60 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
      {"stage": "80 DAS", "nPct": 25, "pPct": 0, "kPct": 25}
    ]'::jsonb,
    updated_at = now()
where crop_name = 'Cotton' and variety = 'Hybrid';
