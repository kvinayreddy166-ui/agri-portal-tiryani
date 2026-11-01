export type AgrochemicalCategory = 'all' | 'insecticide' | 'fungicide' | 'weedicide' | 'fertilizer';

export type ToxicityBand = 'red' | 'yellow' | 'blue' | 'green' | 'unclassified';

export interface AgrochemicalItem {
  id: string;
  name: string; // e.g. "Chlorantraniliprole 18.5% SC"
  nameTe: string; // Telugu translation
  category: 'insecticide' | 'fungicide' | 'weedicide' | 'fertilizer';
  categoryTe: string;
  popularBrands: string[]; // e.g. ["Coragen", "Cosko", "Cover"]
  chemicalFamily: string; // e.g. "Anthranilic diamide"
  chemicalFamilyTe: string;
  moaGroup: string; // e.g. "IRAC Group 28" / "FRAC Group 3" / "HRAC Group 2"
  moaGroupName: string; // e.g. "Ryanodine receptor modulators"
  moaDescription: string;
  moaDescriptionTe: string;
  formulations: string[]; // e.g. ["18.5% SC", "0.4% GR"]
  toxicityBand: ToxicityBand;
  toxicityLabel: string; // e.g. "Slightly Toxic (Green)"
  toxicityLabelTe: string;
  targetCrops: string[]; // e.g. ["Paddy", "Cotton", "Chilli", "Tomato"]
  targetCropsTe: string[];
  targetPests: string[]; // e.g. ["Stem borer", "Leaf folder", "Fruit borer"]
  targetPestsTe: string[];
  dosagePerAcre: string; // e.g. "60 ml/acre"
  dosagePerAcreTe: string;
  dosagePerLitre: string; // e.g. "0.3 ml / Litre (4.5 ml per 15L pump)"
  dosagePerLitreTe: string;
  waitingPeriodDays: number | string; // e.g. 14, 21, or "N/A"
  sprayPrecautions: string;
  sprayPrecautionsTe: string;
  antidoteInfo: string;
  antidoteInfoTe: string;
  fcoSpecification?: string; // For fertilizers: N-P-K nutrient composition %
  fcoSpecificationTe?: string;
  // Level 1 CIB-RC Regulatory Audit Fields
  verificationStatus?: AgrochemicalVerificationStatus;
  verificationAudit?: AgrochemicalVerificationAudit;
  cibrcApprovedClaims?: CropPestLabelClaim[];
  cibrcPages?: number[];
  isDosageCalculated?: boolean;
}

export interface CropPestLabelClaim {
  crop: string;
  cropTe?: string;
  targetPest: string;
  targetPestTe?: string;
  aiDosePerHa: string;
  formulationDosePerHa: string;
  dilutionWaterPerHa: string;
  calculatedDosePerAcre: string;
  calculatedDosePerAcreTe?: string;
  phiDays: string;
  cibrcPage: number;
}

export type AgrochemicalVerificationStatus =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'UNVERIFIED'
  | 'NOT_AVAILABLE'
  | 'CONFLICTING_EVIDENCE';

export interface AgrochemicalVerificationAudit {
  status: AgrochemicalVerificationStatus;
  primaryRegulatorySource: string;
  cibrcPages: number[];
  verifiedClaimsCount: number;
  brandsAudited: boolean;
  notes?: string;
}

export interface AgrochemicalFilterOptions {
  query: string;
  category: AgrochemicalCategory;
  letter: string; // '' for all, or 'A' through 'Z'
  moaGroup?: string;
  crop?: string;
}
