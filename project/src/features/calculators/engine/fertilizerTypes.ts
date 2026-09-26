export type NutrientKey = string;

export type NutrientComposition = Record<NutrientKey, number>;

export type Nutrients = {
  n: number;
  p: number;
  k: number;
  [nutrient: string]: unknown;
};

export type FertilizerGrade = {
  id?: string;
  name: string;
  n: number;
  p: number;
  k: number;
  s: number;
  bag_kg: number;
  composition?: NutrientComposition;
  is_active?: boolean;
};

export type SplitDose = {
  stage: string;
  nPct: number;
  pPct: number;
  kPct: number;
  nutrientsPct?: NutrientComposition;
  notes?: string;
  top_dressing_n_kg?: number;
  gypsum_kg?: number;
};

export type CropRecommendation = Nutrients & {
  id?: string;
  crop_name: string;
  crop?: string;
  zone?: string;
  season?: string;
  variety?: string;
  area_unit?: string;
  nutrients?: NutrientComposition;
  split_plan?: SplitDose[];
  is_active?: boolean;
};

export type FertilizerResult = {
  grade: FertilizerGrade;
  kg: number;
  bags: number;
  supplied: Nutrients;
};

export type FertilizerCalculation = {
  results: FertilizerResult[];
  supplied: Nutrients;
  balance: Nutrients;
  excess: Nutrients;
  remarks: string[];
};
