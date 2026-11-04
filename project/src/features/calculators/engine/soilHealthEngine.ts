export interface LabFormState {
  phBracket: string;
  ecBracket: string;
  ocBracket: string;
  nBracket: string;
  pBracket: string;
  kBracket: string;
  caBracket: string;
  mgBracket: string;
  sBracket: string;
  znBracket: string;
  mnBracket: string;
  feBracket: string;
  cuBracket: string;
  bBracket: string;
  phNum?: string;
  ecNum?: string;
  ocNum?: string;
  nNum?: string;
  pNum?: string;
  kNum?: string;
}

export interface FieldIndicatorState {
  soilStructure: number; // 1 = Good, 2 = Medium, 3 = Poor
  drainage: number;
  waterHolding: number;
  compaction: number;
  erosion: number;
  organicMatter: number;
  earthworms: number;
  cropCondition: number;
  microbial: number;
  rootGrowth: number;
}

export interface MicronutrientEvaluation {
  name: string;
  nameTe: string;
  status: string;
  statusTe: string;
  isLow: boolean;
  remedy: string;
  remedyTe: string;
}

export interface LabScoreResult {
  phPoints: number;
  phStatus: string;
  phColor: string;
  phRemedy: string;
  ecPoints: number;
  ecStatus: string;
  ecColor: string;
  ecRemedy: string;
  ocPoints: number;
  ocStatus: string;
  ocColor: string;
  ocRemedy: string;
  nPoints: number;
  nAdj: string;
  pPoints: number;
  pAdj: string;
  kPoints: number;
  kAdj: string;
  microPoints: number;
  micronutrientScores: MicronutrientEvaluation[];
  totalLabScore: number;
}

export interface FieldScoreResult {
  physScoreRaw: number;
  physPercent: number;
  bioScoreRaw: number;
  bioPercent: number;
  totalScore: number;
}

export interface HealthTier {
  tier: 'healthy' | 'moderate' | 'degraded' | 'critical';
  labelEn: string;
  labelTe: string;
  color: string;
  badgeBg: string;
  border: string;
  cardBg: string;
  summaryEn: string;
  summaryTe: string;
}

export function calculateLabScore(form: LabFormState): LabScoreResult {
  // 1. pH Score (0 to 15 points)
  let phPoints = 15;
  let phStatus = 'Neutral / Optimum (6.5 - 7.5)';
  let phColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
  let phRemedy = 'Optimal pH. No lime or gypsum needed.';

  if (form.phBracket === '1') {
    phPoints = 4;
    phStatus = 'Strongly Acidic (pH < 5.5)';
    phColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    phRemedy = 'Apply Agricultural Lime or Dolomite @ 200-250 kg/acre 2-3 weeks before sowing.';
  } else if (form.phBracket === '2') {
    phPoints = 8;
    phStatus = 'Moderately Acidic (pH 5.6 - 6.0)';
    phColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
    phRemedy = 'Apply Agricultural Lime @ 100-150 kg/acre. Use rock phosphate for P.';
  } else if (form.phBracket === '3') {
    phPoints = 12;
    phStatus = 'Slightly Acidic (pH 6.1 - 6.5)';
    phColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300';
    phRemedy = 'Mild acidity. Apply 50-75 kg lime/acre or incorporate organic compost.';
  } else if (form.phBracket === '5') {
    phPoints = 6;
    phStatus = 'Alkaline / Sodic (pH > 8.0)';
    phColor = 'text-red-700 bg-red-50 dark:bg-red-950/40 border-red-300';
    phRemedy = 'Apply Agricultural Gypsum @ 500-1000 kg/acre, mix in top 10 cm and flush with good water.';
  }

  // 2. EC Score (0 to 10 points)
  let ecPoints = 10;
  let ecStatus = 'Normal (< 1.0 dS/m)';
  let ecColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
  let ecRemedy = 'Salt concentration is safe for all crops.';

  if (form.ecBracket === '2') {
    ecPoints = 5;
    ecStatus = 'Critical / Medium (1.0 - 3.0 dS/m)';
    ecColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
    ecRemedy = 'Critical for sensitive pulses & oilseeds. Ensure drainage and avoid saline irrigation.';
  } else if (form.ecBracket === '3') {
    ecPoints = 2;
    ecStatus = 'Injurious / Saline (> 3.0 dS/m)';
    ecColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    ecRemedy = 'Injurious to germination & yield. Construct drainage trenches and leach salts with ponded water.';
  }

  // 3. OC Score (0 to 15 points)
  let ocPoints = 11;
  let ocStatus = 'Medium (0.76% - 1.50%)';
  let ocColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300';
  let ocRemedy = 'Maintain soil humus with 4-5 tonnes FYM/acre annually.';

  if (form.ocBracket === '1') {
    ocPoints = 5;
    ocStatus = 'Low (< 0.76%)';
    ocColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    ocRemedy = 'Critically low organic matter. Incorporate 8-10 tonnes FYM/acre or 2 tonnes Vermicompost. Grow green manure.';
  } else if (form.ocBracket === '3') {
    ocPoints = 15;
    ocStatus = 'High (> 1.50%)';
    ocColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    ocRemedy = 'Rich soil organic carbon! Excellent microbial activity and nutrient retention.';
  }

  // 4. Primary Nutrients N-P-K (10 points each = 30 pts)
  const nPoints = form.nBracket === '1' ? 4 : form.nBracket === '2' ? 8 : 10;
  const nAdj = form.nBracket === '1' ? '+25% RDF' : form.nBracket === '2' ? '100% RDF' : '-25% RDF';

  const pPoints = form.pBracket === '1' ? 4 : form.pBracket === '2' ? 8 : 10;
  const pAdj = form.pBracket === '1' ? '+25% RDF' : form.pBracket === '2' ? '100% RDF' : '-25% RDF';

  const kPoints = form.kBracket === '1' ? 4 : form.kBracket === '2' ? 8 : 10;
  const kAdj = form.kBracket === '1' ? '+25% RDF' : form.kBracket === '2' ? '100% RDF' : '-25% RDF';

  // 5. Micronutrients & Secondary Elements (30 points total)
  const micronutrientScores: MicronutrientEvaluation[] = [];

  const sLow = form.sBracket === '1';
  micronutrientScores.push({
    name: 'Available Sulfur (S)', nameTe: 'లభ్య గంధకం (S)',
    status: sLow ? 'Deficient (<10 ppm)' : 'Sufficient (>10 ppm)',
    statusTe: sLow ? 'లోపం (<10 ppm)' : 'సరిపడా (>10 ppm)',
    isLow: sLow,
    remedy: sLow ? 'Apply Gypsum @ 50 kg/acre or Bensulf (Sulfur 90%) @ 10 kg/acre.' : 'No action needed.',
    remedyTe: sLow ? 'ఎకరానికి 50 కిలోల జిప్సం లేదా 10 కిలోల బెన్‌సల్ఫ్ వేయండి.' : 'సరిపడా ఉంది.',
  });

  const znLow = form.znBracket === '1';
  micronutrientScores.push({
    name: 'Zinc (Zn)', nameTe: 'జింక్ (Zn)',
    status: znLow ? 'Deficient (<0.5 ppm)' : 'Sufficient (≥0.5 ppm)',
    statusTe: znLow ? 'లోపం (<0.5 ppm)' : 'సరిపడా (≥0.5 ppm)',
    isLow: znLow,
    remedy: znLow ? 'Soil apply Zinc Sulfate 21% @ 10 kg/acre or 33% @ 5 kg/acre; or spray 0.2% Zn-EDTA.' : 'No action needed.',
    remedyTe: znLow ? 'ఎకరానికి జింక్ సల్ఫేట్ 21% 10 కిలోలు లేదా 33% 5 కిలోలు వేయండి లేదా 0.2% జింక్ స్ప్రే చేయండి.' : 'సరిపడా ఉంది.',
  });

  const feLow = form.feBracket === '1';
  micronutrientScores.push({
    name: 'Iron (Fe)', nameTe: 'ఇనుము (Fe)',
    status: feLow ? 'Deficient (<3.7 ppm)' : 'Sufficient (≥3.7 ppm)',
    statusTe: feLow ? 'లోపం (<3.7 ppm)' : 'సరిపడా (≥3.7 ppm)',
    isLow: feLow,
    remedy: feLow ? 'Foliar spray Ferrous Sulfate @ 5 g + Citric acid @ 1 g per litre twice at 10-day intervals.' : 'No action needed.',
    remedyTe: feLow ? 'లీటరు నీటికి 5 గ్రాముల అన్నభేది (FeSO4) + 1 గ్రాము నిమ్మ ఉప్పు కలిపి 10 రోజుల వ్యవధిలో రెండుసార్లు పిచికారీ చేయండి.' : 'సరిపడా ఉంది.',
  });

  const bLow = form.bBracket === '1';
  micronutrientScores.push({
    name: 'Boron (B)', nameTe: 'బోరాన్ (B)',
    status: bLow ? 'Deficient (<0.5 ppm)' : 'Sufficient (≥0.5 ppm)',
    statusTe: bLow ? 'లోపం (<0.5 ppm)' : 'సరిపడా (≥0.5 ppm)',
    isLow: bLow,
    remedy: bLow ? 'Soil apply Borax @ 2-3 kg/acre or foliar spray Solubor (Boron 20%) @ 1-1.5 g/L at pre-flowering.' : 'No action needed.',
    remedyTe: bLow ? 'ఎకరానికి 2-3 కిలోల బోరాక్స్ నేలలో వేయండి లేదా పూతకు ముందు లీటరుకు 1.5 గ్రాముల బోరాన్ 20% పిచికారీ చేయండి.' : 'సరిపడా ఉంది.',
  });

  let microPoints = 30;
  if (sLow) microPoints -= 5;
  if (znLow) microPoints -= 6;
  if (feLow) microPoints -= 5;
  if (bLow) microPoints -= 5;
  if (form.caBracket === '1') microPoints -= 3;
  if (form.mgBracket === '1') microPoints -= 2;
  if (form.mnBracket === '1') microPoints -= 2;
  if (form.cuBracket === '1') microPoints -= 2;
  microPoints = Math.max(0, microPoints);

  const totalLabScore = Math.min(100, Math.round(phPoints + ecPoints + ocPoints + nPoints + pPoints + kPoints + microPoints));

  return {
    phPoints, phStatus, phColor, phRemedy,
    ecPoints, ecStatus, ecColor, ecRemedy,
    ocPoints, ocStatus, ocColor, ocRemedy,
    nPoints, nAdj,
    pPoints, pAdj,
    kPoints, kAdj,
    microPoints,
    micronutrientScores,
    totalLabScore,
  };
}

export function calculateFieldScore(state: FieldIndicatorState): FieldScoreResult {
  const scoreItem = (val: number) => (val === 1 ? 10 : val === 2 ? 6 : 2);

  const physScoreRaw =
    scoreItem(state.soilStructure) +
    scoreItem(state.drainage) +
    scoreItem(state.waterHolding) +
    scoreItem(state.compaction) +
    scoreItem(state.erosion);
  const physPercent = Math.round((physScoreRaw / 50) * 100);

  const bioScoreRaw =
    scoreItem(state.organicMatter) +
    scoreItem(state.earthworms) +
    scoreItem(state.cropCondition) +
    scoreItem(state.microbial) +
    scoreItem(state.rootGrowth);
  const bioPercent = Math.round((bioScoreRaw / 50) * 100);

  const totalScore = Math.round(physScoreRaw + bioScoreRaw);

  return {
    physScoreRaw,
    physPercent,
    bioScoreRaw,
    bioPercent,
    totalScore,
  };
}

export function getHealthTier(score: number): HealthTier {
  if (score >= 80) {
    return {
      tier: 'healthy',
      labelEn: 'Healthy / High Fertility',
      labelTe: 'ఆరోగ్యకరమైన సారవంతమైన నేల',
      color: 'text-emerald-700 dark:text-emerald-300',
      badgeBg: 'bg-emerald-500 text-white',
      border: 'border-emerald-300 dark:border-emerald-800',
      cardBg: 'from-emerald-500/10 via-emerald-500/5 to-teal-500/10',
      summaryEn: 'Soil biological, physical and chemical parameters are in excellent harmony. Balanced maintenance is recommended.',
      summaryTe: 'మట్టి భౌతిక, రసాయన మరియు జీవ లక్షణాలు సమతుల్యంగా ఉన్నాయి. క్రమం తప్పకుండా సాధారణ పోషణ కొనసాగించండి.',
    };
  }
  if (score >= 60) {
    return {
      tier: 'moderate',
      labelEn: 'Moderately Healthy / Good',
      labelTe: 'మధ్యస్థ సారవంతమైన నేల',
      color: 'text-lime-700 dark:text-lime-300',
      badgeBg: 'bg-lime-600 text-white',
      border: 'border-lime-300 dark:border-lime-800',
      cardBg: 'from-lime-500/10 via-amber-500/5 to-emerald-500/10',
      summaryEn: 'Soil is generally productive but has mild nutrient deficiencies or minor physical constraints.',
      summaryTe: 'నేల ఉత్పాదకత సాధారణంగా ఉంది కానీ కొన్ని సూక్ష్మ పోషక లోపాలు లేదా సేంద్రీయ పదార్థ లోపం ఉంది.',
    };
  }
  if (score >= 40) {
    return {
      tier: 'degraded',
      labelEn: 'Degraded / Sub-optimal',
      labelTe: 'సమస్యాత్మక / క్షీణించిన నేల',
      color: 'text-amber-700 dark:text-amber-300',
      badgeBg: 'bg-amber-600 text-white',
      border: 'border-amber-300 dark:border-amber-800',
      cardBg: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
      summaryEn: 'Soil shows substantial degradation (acidity, compaction, or severe humus depletion). Systematic soil reclamation is required.',
      summaryTe: 'నేల గణనీయంగా క్షీణించింది (ఆమ్లత, గట్టిపడటం లేదా కర్బన లోపం). క్రమబద్ధమైన సవరణ చర్యలు తక్షణావశ్యకం.',
    };
  }
  return {
    tier: 'critical',
    labelEn: 'Critical / Poor Quality',
    labelTe: 'అత్యంత సమస్యాత్మక నేల',
    color: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-600 text-white',
    border: 'border-rose-300 dark:border-rose-800',
    cardBg: 'from-rose-500/10 via-red-500/5 to-orange-500/10',
    summaryEn: 'Severe soil degradation threatening crop viability (strong salinity/alkalinity or extreme acidity). Requires immediate reclamation protocol.',
    summaryTe: 'పంట దిగుబడిని తీవ్రంగా దెబ్బతీసే స్థితి (చౌడు, ఉప్పు లేదా తీవ్ర ఆమ్లత). తక్షణ పునరుద్ధరణ చర్యలు చేపట్టాలి.',
  };
}
