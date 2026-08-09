-- Remove phosphorus dose notes from cotton split plans
update public.crop_fertilizer_recommendations
set split_plan = '[
  {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0},
  {"stage": "30 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
  {"stage": "60 DAS", "nPct": 33.33, "pPct": 0, "kPct": 33.33},
  {"stage": "90 DAS", "nPct": 33.34, "pPct": 0, "kPct": 33.34}
]'
where crop_name = 'Cotton' and variety = 'Normal';

update public.crop_fertilizer_recommendations
set split_plan = '[
  {"stage": "Basal (at sowing)", "nPct": 0, "pPct": 100, "kPct": 0},
  {"stage": "20 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
  {"stage": "40 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
  {"stage": "60 DAS", "nPct": 25, "pPct": 0, "kPct": 25},
  {"stage": "80 DAS", "nPct": 25, "pPct": 0, "kPct": 25}
]'
where crop_name = 'Cotton' and variety = 'Hybrid';
