import type { CropRecommendation, FertilizerGrade, SplitDose } from './fertilizerTypes';

export const PRIMARY_NUTRIENTS = ['n', 'p', 'k'] as const;
export const KNOWN_NUTRIENTS = ['n', 'p', 'k', 's', 'zn', 'b', 'fe', 'mg', 'ca', 'mn', 'cu', 'mo', 'si', 'organicCarbon'] as const;
export const REMOVED_FERTILIZER_GRADES = new Set(['16:20:0:13', '20:20:0:13', '20:20:0', '24:24:0', '28:28:0']);

export const NUTRIENT_LABELS: Record<string, string> = {
  n: 'N',
  p: 'P2O5',
  k: 'K2O',
  s: 'S',
  zn: 'Zn',
  b: 'B',
  fe: 'Fe',
  mg: 'Mg',
  ca: 'Ca',
  mn: 'Mn',
  cu: 'Cu',
  mo: 'Mo',
  si: 'Si',
  organicCarbon: 'Organic Carbon',
};

export const DEFAULT_SPLIT: SplitDose[] = [
  { stage: 'Basal', nPct: 30, pPct: 100, kPct: 50 },
  { stage: '20 DAS', nPct: 25, pPct: 0, kPct: 20 },
  { stage: '40 DAS', nPct: 25, pPct: 0, kPct: 20 },
  { stage: '60 DAS', nPct: 20, pPct: 0, kPct: 10 },
  { stage: '80 DAS', nPct: 0, pPct: 0, kPct: 0 },
];

export const DEFAULT_GRADES: FertilizerGrade[] = [
  { name: 'Urea', n: 46, p: 0, k: 0, s: 0, bag_kg: 45, composition: { n: 46 } },
  { name: 'Ammonium Sulphate', n: 21, p: 0, k: 0, s: 24, bag_kg: 50, composition: { n: 21, s: 24 } },
  { name: 'DAP', n: 18, p: 46, k: 0, s: 0, bag_kg: 50, composition: { n: 18, p: 46 } },
  { name: 'MOP', n: 0, p: 0, k: 60, s: 0, bag_kg: 50, composition: { k: 60 } },
  { name: 'SSP', n: 0, p: 16, k: 0, s: 0, bag_kg: 50, composition: { p: 16 } },
  { name: 'TSP', n: 0, p: 46, k: 0, s: 0, bag_kg: 50, composition: { p: 46 } },
  { name: '10:26:26', n: 10, p: 26, k: 26, s: 0, bag_kg: 50, composition: { n: 10, p: 26, k: 26 } },
  { name: '12:32:16', n: 12, p: 32, k: 16, s: 0, bag_kg: 50, composition: { n: 12, p: 32, k: 16 } },
  { name: '14:35:14', n: 14, p: 35, k: 14, s: 0, bag_kg: 50, composition: { n: 14, p: 35, k: 14 } },
  { name: '15:15:15', n: 15, p: 15, k: 15, s: 0, bag_kg: 50, composition: { n: 15, p: 15, k: 15 } },
  { name: '16:16:16', n: 16, p: 16, k: 16, s: 0, bag_kg: 50, composition: { n: 16, p: 16, k: 16 } },
  { name: '17:17:17', n: 17, p: 17, k: 17, s: 0, bag_kg: 50, composition: { n: 17, p: 17, k: 17 } },
  { name: '19:19:19', n: 19, p: 19, k: 19, s: 0, bag_kg: 50, composition: { n: 19, p: 19, k: 19 } },
  { name: '28:28:28', n: 28, p: 28, k: 28, s: 0, bag_kg: 50, composition: { n: 28, p: 28, k: 28 } },
];

export const COTTON_SPLIT: SplitDose[] = [
  { stage: 'Basal', nPct: 0, pPct: 100, kPct: 0 },
  { stage: '20 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '40 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '60 DAS', nPct: 25, pPct: 0, kPct: 25 },
  { stage: '80 DAS', nPct: 25, pPct: 0, kPct: 25 },
];

export const PADDY_SPLIT: SplitDose[] = [
  { stage: 'Before transplanting / final puddling', nPct: 34, pPct: 100, kPct: 100 },
  { stage: 'Active tillering stage', nPct: 33, pPct: 0, kPct: 0 },
  { stage: 'Panicle initiation stage', nPct: 33, pPct: 0, kPct: 0 },
];

export const PADDY_LONG_DURATION_SPLIT: SplitDose[] = [
  { stage: 'Before transplanting / final puddling', nPct: 25, pPct: 100, kPct: 100 },
  { stage: '15-20 days after first split', nPct: 25, pPct: 0, kPct: 0 },
  { stage: '15-20 days after second split', nPct: 25, pPct: 0, kPct: 0 },
  { stage: 'Panicle initiation stage', nPct: 25, pPct: 0, kPct: 0 },
];

export const MAIZE_SPLIT: SplitDose[] = [
  { stage: 'Basal at sowing', nPct: 34, pPct: 100, kPct: 50 },
  { stage: 'Knee-high stage', nPct: 33, pPct: 0, kPct: 0 },
  { stage: 'Flowering / tasseling stage', nPct: 33, pPct: 0, kPct: 50 },
];

export const BASAL_SPLIT: SplitDose[] = [
  { stage: 'Basal before sowing', nPct: 100, pPct: 100, kPct: 100 },
];

export const DEFAULT_RECOMMENDATIONS: CropRecommendation[] = [
  { crop_name: 'Cotton - Normal', crop: 'Cotton', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 36, p: 18, k: 18, area_unit: 'acre', nutrients: { n: 36, p: 18, k: 18 }, split_plan: COTTON_SPLIT },
  { crop_name: 'Cotton - Hybrid', crop: 'Cotton', zone: 'All Zones', season: 'Vanakalam', variety: 'Hybrid', n: 48, p: 24, k: 24, area_unit: 'acre', nutrients: { n: 48, p: 24, k: 24 }, split_plan: COTTON_SPLIT },
  { crop_name: 'Paddy Vanakalam - Northern Telangana', crop: 'Paddy', zone: 'Northern Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 20, k: 16, area_unit: 'acre', nutrients: { n: 48, p: 20, k: 16 }, split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Vanakalam - Central Telangana', crop: 'Paddy', zone: 'Central Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 20, k: 16, area_unit: 'acre', nutrients: { n: 48, p: 20, k: 16 }, split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Vanakalam - Southern Telangana', crop: 'Paddy', zone: 'Southern Telangana', season: 'Vanakalam', variety: 'Normal', n: 48, p: 24, k: 16, area_unit: 'acre', nutrients: { n: 48, p: 24, k: 16 }, split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Yasangi - All Zones', crop: 'Paddy', zone: 'All Zones', season: 'Yasangi', variety: 'Normal', n: 60, p: 24, k: 16, area_unit: 'acre', nutrients: { n: 60, p: 24, k: 16 }, split_plan: PADDY_SPLIT },
  { crop_name: 'Paddy Long Duration - All Zones', crop: 'Paddy', zone: 'All Zones', season: 'All Seasons', variety: 'Long Duration', n: 60, p: 24, k: 16, area_unit: 'acre', nutrients: { n: 60, p: 24, k: 16 }, split_plan: PADDY_LONG_DURATION_SPLIT },
  { crop_name: 'Maize Kharif - Normal', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 80, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 80, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Sweet Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Sweet Corn', n: 72, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 72, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Pop Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Pop Corn', n: 32, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 32, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Kharif - Baby Corn', crop: 'Maize', zone: 'All Zones', season: 'Vanakalam', variety: 'Baby Corn', n: 48, p: 20, k: 16, area_unit: 'acre', nutrients: { n: 48, p: 20, k: 16 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Normal', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Normal', n: 90, p: 32, k: 32, area_unit: 'acre', nutrients: { n: 90, p: 32, k: 32 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Sweet Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Sweet Corn', n: 80, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 80, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Pop Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Pop Corn', n: 40, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 40, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Maize Yasangi - Baby Corn', crop: 'Maize', zone: 'All Zones', season: 'Yasangi', variety: 'Baby Corn', n: 70, p: 24, k: 20, area_unit: 'acre', nutrients: { n: 70, p: 24, k: 20 }, split_plan: MAIZE_SPLIT },
  { crop_name: 'Redgram', crop: 'Redgram', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 8, p: 20, k: 0, area_unit: 'acre', nutrients: { n: 8, p: 20, k: 0 }, split_plan: BASAL_SPLIT },
  { crop_name: 'Greengram', crop: 'Greengram', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 8, p: 20, k: 0, area_unit: 'acre', nutrients: { n: 8, p: 20, k: 0 }, split_plan: BASAL_SPLIT },
  { crop_name: 'Sesamum', crop: 'Sesamum', zone: 'All Zones', season: 'Vanakalam', variety: 'Normal', n: 16, p: 8, k: 8, area_unit: 'acre', nutrients: { n: 16, p: 8, k: 8 }, split_plan: BASAL_SPLIT },
];
