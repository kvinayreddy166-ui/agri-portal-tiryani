export const SQ_METERS_PER_ACRE = 4046.8564224;
export const SQ_METERS_PER_GUNTA = SQ_METERS_PER_ACRE / 40; // ~101.1714 m²
export const SQ_METERS_PER_HECTARE = 10000;

export type AreaUnit = 'acres' | 'guntas' | 'hectares';
export type LengthUnit = 'cm' | 'm' | 'feet';

export interface FormattedTime {
  hours: number;
  minutes: number;
  text: string;
}

export function toSquareMeters(area: number, unit: AreaUnit): number {
  if (area <= 0 || !Number.isFinite(area)) return 0;
  switch (unit) {
    case 'acres':
      return area * SQ_METERS_PER_ACRE;
    case 'guntas':
      return area * SQ_METERS_PER_GUNTA;
    case 'hectares':
      return area * SQ_METERS_PER_HECTARE;
    default:
      return 0;
  }
}

export function toMeters(value: number, unit: LengthUnit): number {
  if (value <= 0 || !Number.isFinite(value)) return 0;
  switch (unit) {
    case 'm':
      return value;
    case 'cm':
      return value / 100;
    case 'feet':
      return value * 0.3048;
    default:
      return 0;
  }
}

export function formatHoursMinutes(decimalHours: number): FormattedTime {
  if (!Number.isFinite(decimalHours) || decimalHours <= 0) {
    return { hours: 0, minutes: 0, text: '0m' };
  }
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return { hours, minutes, text: `${minutes}m` };
  }
  return { hours, minutes, text: `${hours}h ${minutes}m` };
}

// ----------------------------------------------------
// DRIP IRRIGATION
// ----------------------------------------------------

export interface DripIrrigationInput {
  cropName: string;
  area: number;
  areaUnit: AreaUnit;
  rowSpacing: number;
  rowSpacingUnit: LengthUnit;
  plantSpacing: number;
  plantSpacingUnit: LengthUnit;
  emitterSpacing: number;
  emitterSpacingUnit: LengthUnit;
  emitterDischarge: number; // LPH
  waterRequirementPerPlant: number; // Litres/plant/day
  pumpHorsePower?: number; // Optional pump HP
}

export interface DripIrrigationResult {
  isValid: boolean;
  errors: string[];
  totalAreaM2: number;
  totalPlants: number;
  totalLateralLengthMeters: number;
  totalEmitters: number;
  emittersPerPlant: number;
  dailyWaterVolumeLitres: number;
  systemDischargeLph: number;
  systemDischargeM3Hr: number;
  pumpRunHours: number;
  formattedRunTime: FormattedTime;
  estimatedPowerKwh?: number;
}

export function calculateDripIrrigation(input: DripIrrigationInput): DripIrrigationResult {
  const errors: string[] = [];
  const areaM2 = toSquareMeters(input.area, input.areaUnit);
  const rowM = toMeters(input.rowSpacing, input.rowSpacingUnit);
  const plantM = toMeters(input.plantSpacing, input.plantSpacingUnit);
  const emitterM = toMeters(input.emitterSpacing, input.emitterSpacingUnit);

  if (areaM2 <= 0) errors.push('Area must be greater than 0');
  if (rowM <= 0) errors.push('Row spacing must be greater than 0');
  if (plantM <= 0) errors.push('Plant spacing must be greater than 0');
  if (emitterM <= 0) errors.push('Emitter spacing must be greater than 0');
  if (input.emitterDischarge <= 0) errors.push('Emitter discharge must be greater than 0');
  if (input.waterRequirementPerPlant <= 0) errors.push('Water requirement must be greater than 0');

  if (errors.length > 0 || areaM2 <= 0 || rowM <= 0 || plantM <= 0 || emitterM <= 0) {
    return {
      isValid: false,
      errors,
      totalAreaM2: areaM2,
      totalPlants: 0,
      totalLateralLengthMeters: 0,
      totalEmitters: 0,
      emittersPerPlant: 0,
      dailyWaterVolumeLitres: 0,
      systemDischargeLph: 0,
      systemDischargeM3Hr: 0,
      pumpRunHours: 0,
      formattedRunTime: { hours: 0, minutes: 0, text: '0m' },
    };
  }

  const areaPerPlant = rowM * plantM;
  const totalPlants = areaM2 / areaPerPlant;

  // Lateral length: for a rectangular area, total lateral length is Area / Row_Spacing
  const totalLateralLengthMeters = areaM2 / rowM;

  // Total emitters: lateral length / emitter spacing
  const totalEmitters = totalLateralLengthMeters / emitterM;

  // Emitters per plant
  const emittersPerPlant = plantM / emitterM;

  // Daily water volume = total plants * water requirement per plant
  const dailyWaterVolumeLitres = totalPlants * input.waterRequirementPerPlant;

  // System discharge = total emitters * discharge per emitter (LPH)
  const systemDischargeLph = totalEmitters * input.emitterDischarge;
  const systemDischargeM3Hr = systemDischargeLph / 1000;

  // Pump run hours = Total water required (Litres) / System discharge (LPH)
  const pumpRunHours = systemDischargeLph > 0 ? dailyWaterVolumeLitres / systemDischargeLph : 0;
  const formattedRunTime = formatHoursMinutes(pumpRunHours);

  // Power calculation: 1 HP ≈ 0.746 kW * run hours (assuming 85% motor efficiency)
  const estimatedPowerKwh = input.pumpHorsePower && input.pumpHorsePower > 0
    ? (input.pumpHorsePower * 0.746 * pumpRunHours) / 0.85
    : undefined;

  return {
    isValid: true,
    errors: [],
    totalAreaM2: areaM2,
    totalPlants,
    totalLateralLengthMeters,
    totalEmitters,
    emittersPerPlant,
    dailyWaterVolumeLitres,
    systemDischargeLph,
    systemDischargeM3Hr,
    pumpRunHours,
    formattedRunTime,
    estimatedPowerKwh,
  };
}

// ----------------------------------------------------
// SPRINKLER IRRIGATION
// ----------------------------------------------------

export interface SprinklerIrrigationInput {
  cropName: string;
  area: number;
  areaUnit: AreaUnit;
  spacingX: number; // meters between nozzles on lateral
  spacingY: number; // meters between laterals
  nozzleDischargeLph: number; // LPH per sprinkler nozzle
  operatingSprinklers: number; // number of nozzles operating simultaneously per set
  targetDepthMm: number; // mm depth of water required per irrigation
  pumpHorsePower?: number;
}

export interface SprinklerIrrigationResult {
  isValid: boolean;
  errors: string[];
  totalAreaM2: number;
  spacingAreaM2: number;
  applicationRateMmHr: number;
  hoursPerShift: number;
  formattedShiftTime: FormattedTime;
  areaCoveredPerSetM2: number;
  totalShiftsRequired: number;
  totalFieldIrrigationHours: number;
  formattedTotalTime: FormattedTime;
  setDischargeLph: number;
  setDischargeM3Hr: number;
  totalWaterVolumeLitres: number;
  estimatedPowerKwh?: number;
}

export function calculateSprinklerIrrigation(input: SprinklerIrrigationInput): SprinklerIrrigationResult {
  const errors: string[] = [];
  const areaM2 = toSquareMeters(input.area, input.areaUnit);

  if (areaM2 <= 0) errors.push('Area must be greater than 0');
  if (input.spacingX <= 0) errors.push('Sprinkler spacing (X) must be greater than 0');
  if (input.spacingY <= 0) errors.push('Sprinkler spacing (Y) must be greater than 0');
  if (input.nozzleDischargeLph <= 0) errors.push('Nozzle discharge must be greater than 0');
  if (input.operatingSprinklers <= 0) errors.push('Number of sprinklers must be greater than 0');
  if (input.targetDepthMm <= 0) errors.push('Target water depth must be greater than 0');

  const spacingAreaM2 = input.spacingX * input.spacingY;

  if (errors.length > 0 || areaM2 <= 0 || spacingAreaM2 <= 0) {
    return {
      isValid: false,
      errors,
      totalAreaM2: areaM2,
      spacingAreaM2,
      applicationRateMmHr: 0,
      hoursPerShift: 0,
      formattedShiftTime: { hours: 0, minutes: 0, text: '0m' },
      areaCoveredPerSetM2: 0,
      totalShiftsRequired: 0,
      totalFieldIrrigationHours: 0,
      formattedTotalTime: { hours: 0, minutes: 0, text: '0m' },
      setDischargeLph: 0,
      setDischargeM3Hr: 0,
      totalWaterVolumeLitres: 0,
    };
  }

  // Application rate Pr (mm/hr) = Nozzle Discharge (LPH) / Spacing Area (m²)
  // (Since 1 Litre over 1 m² = 1 mm depth)
  const applicationRateMmHr = input.nozzleDischargeLph / spacingAreaM2;

  // Run hours per shift = Target Depth (mm) / Application Rate (mm/hr)
  const hoursPerShift = applicationRateMmHr > 0 ? input.targetDepthMm / applicationRateMmHr : 0;
  const formattedShiftTime = formatHoursMinutes(hoursPerShift);

  // Area covered per set = Number of active sprinklers * spacing area
  const areaCoveredPerSetM2 = input.operatingSprinklers * spacingAreaM2;

  // Total shifts required = Total Area / Area covered per set (rounded up)
  const totalShiftsRequired = areaCoveredPerSetM2 > 0 ? Math.ceil(areaM2 / areaCoveredPerSetM2) : 0;

  // Total field irrigation hours = shifts * hours per shift
  const totalFieldIrrigationHours = totalShiftsRequired * hoursPerShift;
  const formattedTotalTime = formatHoursMinutes(totalFieldIrrigationHours);

  // System discharge for active set
  const setDischargeLph = input.operatingSprinklers * input.nozzleDischargeLph;
  const setDischargeM3Hr = setDischargeLph / 1000;

  // Total water volume for field = Total Area (m²) * Depth (m) * 1000 Litres/m³
  const totalWaterVolumeLitres = areaM2 * (input.targetDepthMm / 1000) * 1000;

  const estimatedPowerKwh = input.pumpHorsePower && input.pumpHorsePower > 0
    ? (input.pumpHorsePower * 0.746 * totalFieldIrrigationHours) / 0.85
    : undefined;

  return {
    isValid: true,
    errors: [],
    totalAreaM2: areaM2,
    spacingAreaM2,
    applicationRateMmHr,
    hoursPerShift,
    formattedShiftTime,
    areaCoveredPerSetM2,
    totalShiftsRequired,
    totalFieldIrrigationHours,
    formattedTotalTime,
    setDischargeLph,
    setDischargeM3Hr,
    totalWaterVolumeLitres,
    estimatedPowerKwh,
  };
}

// ----------------------------------------------------
// PRESETS
// ----------------------------------------------------

export interface DripPreset {
  id: string;
  name: string;
  nameTe: string;
  icon: string;
  rowSpacing: number; // cm
  rowSpacingUnit: LengthUnit;
  plantSpacing: number; // cm
  plantSpacingUnit: LengthUnit;
  emitterSpacing: number; // cm
  emitterSpacingUnit: LengthUnit;
  emitterDischarge: number; // LPH
  waterRequirementPerPlant: number; // Litres/plant/day
  defaultPumpHp?: number;
  stageNote?: string;
  stageNoteTe?: string;
}

export const DRIP_CROP_PRESETS: DripPreset[] = [
  {
    id: 'cotton',
    name: 'Bt Cotton',
    nameTe: 'బిటి పత్తి',
    icon: '🌱',
    rowSpacing: 90,
    rowSpacingUnit: 'cm',
    plantSpacing: 60,
    plantSpacingUnit: 'cm',
    emitterSpacing: 60,
    emitterSpacingUnit: 'cm',
    emitterDischarge: 2.0,
    waterRequirementPerPlant: 3.5,
    defaultPumpHp: 5,
    stageNote: 'Peak flowering/boll development: 3.5–4.5 L/day; Vegetative: 1.5–2.5 L/day',
    stageNoteTe: 'పూత/కాయ దశ: 3.5–4.5 లీ/రోజు; పెరుగుదల దశ: 1.5–2.5 లీ/రోజు',
  },
  {
    id: 'chilli',
    name: 'Chilli',
    nameTe: 'మిరప',
    icon: '🌶️',
    rowSpacing: 60,
    rowSpacingUnit: 'cm',
    plantSpacing: 45,
    plantSpacingUnit: 'cm',
    emitterSpacing: 45,
    emitterSpacingUnit: 'cm',
    emitterDischarge: 2.0,
    waterRequirementPerPlant: 2.5,
    defaultPumpHp: 3,
    stageNote: 'Flowering to fruit maturity: 2.5–3.0 L/plant/day',
    stageNoteTe: 'పూత నుండి కాయ దశ: 2.5–3.0 లీ/మొక్క/రోజు',
  },
  {
    id: 'maize',
    name: 'Maize',
    nameTe: 'మొక్కజొన్న',
    icon: '🌽',
    rowSpacing: 60,
    rowSpacingUnit: 'cm',
    plantSpacing: 20,
    plantSpacingUnit: 'cm',
    emitterSpacing: 40,
    emitterSpacingUnit: 'cm',
    emitterDischarge: 2.0,
    waterRequirementPerPlant: 2.0,
    defaultPumpHp: 5,
    stageNote: 'Tasseling & silking critical stages: 2.0–2.5 L/plant/day',
    stageNoteTe: 'కంకి మరియు పూత దశ: 2.0–2.5 లీ/మొక్క/రోజు',
  },
  {
    id: 'tomato',
    name: 'Tomato / Vegetables',
    nameTe: 'టమోటా / కూరగాయలు',
    icon: '🍅',
    rowSpacing: 60,
    rowSpacingUnit: 'cm',
    plantSpacing: 45,
    plantSpacingUnit: 'cm',
    emitterSpacing: 45,
    emitterSpacingUnit: 'cm',
    emitterDischarge: 2.0,
    waterRequirementPerPlant: 2.5,
    defaultPumpHp: 3,
    stageNote: 'Fruit enlargement: 2.5–3.5 L/plant/day',
    stageNoteTe: 'కాయ ఎదుగుదల దశ: 2.5–3.5 లీ/మొక్క/రోజు',
  },
  {
    id: 'orchard',
    name: 'Fruit Orchard (Mango/Citrus)',
    nameTe: 'పండ్ల తోటలు (మామిడి/నిమ్మ)',
    icon: '🥭',
    rowSpacing: 5,
    rowSpacingUnit: 'm',
    plantSpacing: 5,
    plantSpacingUnit: 'm',
    emitterSpacing: 2.5, // 2 online emitters per tree
    emitterSpacingUnit: 'm',
    emitterDischarge: 4.0,
    waterRequirementPerPlant: 40.0, // 40 Litres/tree/day for mature tree
    defaultPumpHp: 5,
    stageNote: 'Bearing tree summer requirement: 40–60 L/tree/day',
    stageNoteTe: 'కాపుకొచ్చిన చెట్టు వేసవి అవసరం: 40–60 లీ/చెట్టు/రోజు',
  },
  {
    id: 'custom_drip',
    name: 'Custom Drip',
    nameTe: 'ఇతర డ్రిప్ పంట',
    icon: '✨',
    rowSpacing: 90,
    rowSpacingUnit: 'cm',
    plantSpacing: 60,
    plantSpacingUnit: 'cm',
    emitterSpacing: 60,
    emitterSpacingUnit: 'cm',
    emitterDischarge: 2.0,
    waterRequirementPerPlant: 3.0,
    defaultPumpHp: 5,
  },
];

export interface SprinklerPreset {
  id: string;
  name: string;
  nameTe: string;
  icon: string;
  spacingX: number; // m
  spacingY: number; // m
  nozzleDischargeLph: number; // LPH
  operatingSprinklers: number;
  targetDepthMm: number; // mm
  defaultPumpHp?: number;
  frequencyNote?: string;
  frequencyNoteTe?: string;
}

export const SPRINKLER_CROP_PRESETS: SprinklerPreset[] = [
  {
    id: 'groundnut',
    name: 'Groundnut',
    nameTe: 'వేరుశనగ (పల్లీ)',
    icon: '🥜',
    spacingX: 12,
    spacingY: 12,
    nozzleDischargeLph: 1800, // standard 2.5kg/cm² brass nozzle
    operatingSprinklers: 10,
    targetDepthMm: 25,
    defaultPumpHp: 5,
    frequencyNote: 'Critical stages: Flowering, Pegging & Pod development (every 7–10 days)',
    frequencyNoteTe: 'కీలక దశలు: పూత, ఊడల దిగుడు మరియు కాయ ఎదుగుదల (ప్రతి 7-10 రోజులకు)',
  },
  {
    id: 'maize_sprinkler',
    name: 'Maize',
    nameTe: 'మొక్కజొన్న',
    icon: '🌽',
    spacingX: 12,
    spacingY: 12,
    nozzleDischargeLph: 1800,
    operatingSprinklers: 10,
    targetDepthMm: 30,
    defaultPumpHp: 5,
    frequencyNote: 'Knee-high, Tasseling & Grain filling stages (every 10–12 days in Rabi)',
    frequencyNoteTe: 'మోకాలి ఎత్తు, పూత మరియు గింజ పాలు పోసుకునే దశ (రబీలో ప్రతి 10-12 రోజులకు)',
  },
  {
    id: 'pulses',
    name: 'Bengal Gram / Pulses',
    nameTe: 'శనగ / పప్పుధాన్యాలు',
    icon: '🫘',
    spacingX: 12,
    spacingY: 12,
    nozzleDischargeLph: 1500,
    operatingSprinklers: 10,
    targetDepthMm: 25,
    defaultPumpHp: 5,
    frequencyNote: 'Branching and Pod development stage; avoid during peak flowering',
    frequencyNoteTe: 'శాఖలు మరియు కాయ దశ; తీవ్ర పూత దశలో నీరు పెట్టరాదు',
  },
  {
    id: 'wheat',
    name: 'Wheat',
    nameTe: 'గోధుమ',
    icon: '🌾',
    spacingX: 12,
    spacingY: 12,
    nozzleDischargeLph: 1800,
    operatingSprinklers: 10,
    targetDepthMm: 30,
    defaultPumpHp: 5,
    frequencyNote: 'CRI (21 DAS), Tillering, Booting & Milk stages (every 12–15 days)',
    frequencyNoteTe: 'మొలక వేర్లు (21 రోజులు), పిలకల దశ, పొట్ట మరియు పాలు పోసుకునే దశ',
  },
  {
    id: 'custom_sprinkler',
    name: 'Custom Sprinkler',
    nameTe: 'ఇతర స్ప్రింక్లర్ పంట',
    icon: '✨',
    spacingX: 12,
    spacingY: 12,
    nozzleDischargeLph: 1800,
    operatingSprinklers: 10,
    targetDepthMm: 25,
    defaultPumpHp: 5,
  },
];
