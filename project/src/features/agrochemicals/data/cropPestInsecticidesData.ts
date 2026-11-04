// CIB&RC Approved Uses of Registered Insecticides (Crop-Based Schedule)
// Normalized for optimal bundle size and zero hydration lag
// Preserving IRAC Mode of Action, Toxicity Classifications, Popular Market Brands & Field Dosages

import { CropPestInsecticideEntry, ToxicityBand } from '../types';

interface InsecticideMeta {
  insecticide: string;
  insecticideTe: string;
  chemicalId: string;
  chemicalFamily: string;
  chemicalFamilyTe: string;
  iracGroup: string;
  moaGroupName: string;
  moaDescription: string;
  moaDescriptionTe: string;
  popularBrands: string[];
  toxicityBand: ToxicityBand;
  toxicityLabel: string;
  toxicityLabelTe: string;
  waitingPeriodDays: string | number;
  sprayPrecautions: string;
  sprayPrecautionsTe: string;
  antidoteInfo: string;
  antidoteInfoTe: string;
}

interface CompactRow {
  id: string;
  crop: string;
  cropTe: string;
  pest: string;
  pestTe: string;
  metaKey: string;
  aiDosePerHa: string;
  formulationDosePerHa: string;
  sprayFluidPerHa: string;
  calculatedDosePerAcre: string;
  calculatedDosePerPump: string;
  cibrcPage: number;
}

import rawDataJson from './cropPestData.json';

export const INSECTICIDE_METADATA_MAP: Record<string, InsecticideMeta> = rawDataJson.metadata as unknown as Record<string, InsecticideMeta>;
export const RAW_CROP_PEST_ROWS: CompactRow[] = rawDataJson.rows as unknown as CompactRow[];

// Rehydrated complete dataset preserving all fields
export const CROP_PEST_INSECTICIDES_DATA: CropPestInsecticideEntry[] = RAW_CROP_PEST_ROWS.map((row) => {
  const meta = INSECTICIDE_METADATA_MAP[row.metaKey];
  return {
    id: row.id,
    crop: row.crop,
    cropTe: row.cropTe,
    pest: row.pest,
    pestTe: row.pestTe,
    insecticide: meta?.insecticide || row.metaKey,
    insecticideTe: meta?.insecticideTe || row.metaKey,
    aiDosePerHa: row.aiDosePerHa,
    formulationDosePerHa: row.formulationDosePerHa,
    sprayFluidPerHa: row.sprayFluidPerHa,
    calculatedDosePerAcre: row.calculatedDosePerAcre,
    calculatedDosePerPump: row.calculatedDosePerPump,
    cibrcPage: row.cibrcPage,
    chemicalId: meta?.chemicalId || undefined,
    chemicalFamily: meta?.chemicalFamily || 'Synthetic Insecticide',
    chemicalFamilyTe: meta?.chemicalFamilyTe || 'పురుగుమందు',
    iracGroup: meta?.iracGroup || 'Unclassified',
    moaGroupName: meta?.moaGroupName || 'Insecticide Mode of Action',
    moaDescription: meta?.moaDescription || '',
    moaDescriptionTe: meta?.moaDescriptionTe || '',
    popularBrands: meta?.popularBrands || [],
    toxicityBand: (meta?.toxicityBand as ToxicityBand) || 'blue',
    toxicityLabel: meta?.toxicityLabel || 'Moderately Toxic (Blue)',
    toxicityLabelTe: meta?.toxicityLabelTe || 'మధ్యస్థ విషపూరితం (నీలం)',
    waitingPeriodDays: meta?.waitingPeriodDays || 14,
    sprayPrecautions: meta?.sprayPrecautions || 'Follow safety guidelines.',
    sprayPrecautionsTe: meta?.sprayPrecautionsTe || 'రక్షణ చర్యలు పాటించండి.',
    antidoteInfo: meta?.antidoteInfo || 'Treat symptomatically.',
    antidoteInfoTe: meta?.antidoteInfoTe || 'లక్షణాల ఆధారంగా చికిత్స చేయాలి.',
  };
});
