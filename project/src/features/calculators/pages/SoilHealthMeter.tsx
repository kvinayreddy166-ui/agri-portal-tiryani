import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  FlaskConical,
  Gauge,
  Layers,
  Leaf,
  Printer,
  RotateCcw,
  Scale,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sprout,
  TestTube,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../shared/context/LanguageContext';
import { BackButton } from '../../../shared/components/ui/BackButton';
import { LanguageToggle } from '../../../shared/components/ui/LanguageToggle';
import { CompactToolkitHeader } from '../../../shared/components/ui/ToolkitPageHeader';
import { useAuth } from '../../../shared/context/AuthContext';
import { ToastContainer, useToast } from '../../../shared/components/ui/Toast';

// --- Types & Constants ---

type TabMode = 'test-based' | 'indicator-based' | 'advisory';

interface LabFormState {
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
  // Optional precise numeric inputs
  phNum: string;
  ecNum: string;
  ocNum: string;
  nNum: string;
  pNum: string;
  kNum: string;
}

interface FieldIndicatorState {
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

const initialLabForm: LabFormState = {
  phBracket: '4', // Neutral (6.5 - 7.5)
  ecBracket: '1', // Normal (< 1.0)
  ocBracket: '2', // Medium (0.76 - 1.50)
  nBracket: '2', // Medium (280 - 560 kg/ha)
  pBracket: '2', // Medium (10 - 24 kg/ha)
  kBracket: '2', // Medium (115 - 275 kg/ha)
  caBracket: '2', // Medium (1000 - 1600 ppm)
  mgBracket: '2', // Medium (40 - 80 ppm)
  sBracket: '2', // Sufficient (> 10 ppm)
  znBracket: '2', // Medium (0.5 - 1.0 ppm)
  mnBracket: '2', // Medium (1 - 3 ppm)
  feBracket: '2', // Sufficient (> 3.7 ppm)
  cuBracket: '2', // Medium (0.5 - 1.0 ppm)
  bBracket: '2', // Medium (0.5 - 1.0 ppm)
  phNum: '7.0',
  ecNum: '0.4',
  ocNum: '0.85',
  nNum: '320',
  pNum: '18',
  kNum: '190',
};

const initialFieldIndicators: FieldIndicatorState = {
  soilStructure: 1,
  drainage: 1,
  waterHolding: 1,
  compaction: 1,
  erosion: 1,
  organicMatter: 1,
  earthworms: 1,
  cropCondition: 1,
  microbial: 1,
  rootGrowth: 1,
};

export function SoilHealthMeter() {
  const navigate = useNavigate();
  const { language, toggleLanguage, t } = useLanguage();
  const { isAdminUser, isTestUser } = useAuth();
  const showCompactHeader = isAdminUser || isTestUser;
  const { toasts, removeToast, showSuccess } = useToast();

  const [activeTab, setActiveTab] = useState<TabMode>('test-based');
  const [labForm, setLabForm] = useState<LabFormState>(initialLabForm);
  const [fieldState, setFieldState] = useState<FieldIndicatorState>(initialFieldIndicators);
  const [copied, setCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // --- Handlers ---
  const updateLab = (key: keyof LabFormState, val: string) => {
    setLabForm((prev) => ({ ...prev, [key]: val }));
  };

  const updateField = (key: keyof FieldIndicatorState, val: number) => {
    setFieldState((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setIsResetting(true);
    setTimeout(() => setIsResetting(false), 500);
    setLabForm(initialLabForm);
    setFieldState(initialFieldIndicators);
    setCopied(false);
    showSuccess(t('Reset Complete', 'రీసెట్ చేయబడింది'), t('Default values restored.', 'సాధారణ విలువలు పునరుద్ధరించబడ్డాయి.'));
  };

  // --- Computations ---
  // Mode 1: Lab Test Scoring
  const labScoreDetails = useMemo(() => {
    // 1. pH Score (0 to 15 points)
    // 1: <5.5 (Acidic: 4 pts), 2: 5.6-6.0 (Moderately Acidic: 8 pts), 3: 6.1-6.5 (Slightly Acidic: 12 pts), 4: 6.5-7.5 (Neutral: 15 pts), 5: >7.5 (Alkaline: 7 pts)
    const phVal = labForm.phBracket;
    let phPoints = 15;
    let phStatus = t('Neutral / Optimum', 'తటస్థ / అనుకూలమైనది');
    let phColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    let phRemedy = t('Optimal pH. No lime or gypsum needed.', 'అనుకూలమైన పీహెచ్. సున్నం లేదా జిప్సం అవసరం లేదు.');

    if (phVal === '1') {
      phPoints = 4;
      phStatus = t('Strongly Acidic (pH < 5.5)', 'తీవ్ర ఆమ్లత (pH < 5.5)');
      phColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      phRemedy = t('Apply Agricultural Lime or Dolomite @ 200-250 kg/acre 2-3 weeks before sowing.', 'విత్తడానికి 2-3 వారాల ముందు ఎకరానికి 200-250 కిలోల వ్యవసాయ సున్నం లేదా డోలమైట్ వేయండి.');
    } else if (phVal === '2') {
      phPoints = 8;
      phStatus = t('Moderately Acidic (pH 5.6 - 6.0)', 'మధ్యస్థ ఆమ్లత (pH 5.6 - 6.0)');
      phColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      phRemedy = t('Apply Agricultural Lime @ 100-150 kg/acre. Use rock phosphate for P.', 'ఎకరానికి 100-150 కిలోల సున్నం వేయండి. భాస్వరం కొరకు రాక్ ఫాస్ఫేట్ వాడండి.');
    } else if (phVal === '3') {
      phPoints = 12;
      phStatus = t('Slightly Acidic (pH 6.1 - 6.5)', 'స్వల్ప ఆమ్లత (pH 6.1 - 6.5)');
      phColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300';
      phRemedy = t('Mild acidity. Apply 50-75 kg lime/acre or incorporate organic compost.', 'స్వల్ప ఆమ్లత. ఎకరానికి 50-75 కిలోల సున్నం లేదా సేంద్రీయ ఎరువు వేయండి.');
    } else if (phVal === '5') {
      phPoints = 6;
      phStatus = t('Alkaline / Sodic (pH > 8.0)', 'క్షార / చౌడు నేల (pH > 8.0)');
      phColor = 'text-red-700 bg-red-50 dark:bg-red-950/40 border-red-300';
      phRemedy = t('Apply Agricultural Gypsum @ 500-1000 kg/acre, mix in top 10 cm and flush with good water.', 'ఎకరానికి 500-1000 కిలోల వ్యవసాయ జిప్సం వేసి, దుక్కి దున్ని మంచి నీటితో కడిగి వేయండి.');
    }

    // 2. EC Score (0 to 10 points)
    // 1: <1.0 (Normal: 10 pts), 2: 1.0-3.0 (Critical: 5 pts), 3: >3.0 (Injurious: 2 pts)
    const ecVal = labForm.ecBracket;
    let ecPoints = 10;
    let ecStatus = t('Normal (< 1.0 dS/m)', 'సాధారణం (< 1.0 dS/m)');
    let ecColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    let ecRemedy = t('Salt concentration is safe for all crops.', 'లవణాల మోతాదు సాధారణంగా ఉంది. అన్ని పంటలకు అనుకూలం.');

    if (ecVal === '2') {
      ecPoints = 5;
      ecStatus = t('Critical / Medium (1.0 - 3.0 dS/m)', 'మధ్యస్థ లవణీయత (1.0 - 3.0 dS/m)');
      ecColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      ecRemedy = t('Critical for sensitive pulses & oilseeds. Ensure drainage and avoid saline irrigation.', 'సున్నితమైన పప్పుధాన్యాలకు సమస్యాత్మకం. మురుగునీటి పారుదల సౌకర్యం కల్పించండి.');
    } else if (ecVal === '3') {
      ecPoints = 2;
      ecStatus = t('Injurious / Saline (> 3.0 dS/m)', 'అధిక లవణీయత / ఉప్పు నేల (> 3.0 dS/m)');
      ecColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      ecRemedy = t('Injurious to germination & yield. Construct drainage trenches and leach salts with ponded water.', 'విత్తన మొలక మరియు దిగుబడి దెబ్బతింటుంది. మురుగు కాలువలు తీసి ఉప్పును కడిగివేయండి.');
    }

    // 3. OC Score (0 to 15 points)
    // 1: <0.76% (Low: 5 pts), 2: 0.76-1.50% (Medium: 11 pts), 3: >1.50% (High: 15 pts)
    const ocVal = labForm.ocBracket;
    let ocPoints = 11;
    let ocStatus = t('Medium (0.76% - 1.50%)', 'మధ్యస్థం (0.76% - 1.50%)');
    let ocColor = 'text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300';
    let ocRemedy = t('Maintain soil humus with 4-5 tonnes FYM/acre annually.', 'ఏటా ఎకరానికి 4-5 టన్నుల పశువుల ఎరువు వేసి సేంద్రీయతను నిలపండి.');

    if (ocVal === '1') {
      ocPoints = 5;
      ocStatus = t('Low (< 0.76%)', 'తక్కువ (< 0.76%)');
      ocColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      ocRemedy = t('Critically low organic matter. Incorporate 8-10 tonnes FYM/acre or 2 tonnes Vermicompost. Grow green manure (Dhaincha/Sunnhemp).', 'సేంద్రీయ కర్బనం చాలా తక్కువ. ఎకరానికి 8-10 టన్నుల పశువుల ఎరువు లేదా 2 టన్నుల వర్మీకంపోస్ట్ వేయండి. జనుము లేదా జీలుగా పచ్చిరొట్ట ఎరువు సాగు చేయండి.');
    } else if (ocVal === '3') {
      ocPoints = 15;
      ocStatus = t('High (> 1.50%)', 'అధికం (> 1.50%)');
      ocColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
      ocRemedy = t('Rich soil organic carbon! Excellent microbial activity and nutrient retention.', 'సేంద్రీయ కర్బనం సమృద్ధిగా ఉంది! సూక్ష్మజీవుల చర్య మరియు నేల సారవంతం చాలా బాగుంది.');
    }

    // 4. Primary Nutrients N-P-K (10 points each = 30 pts)
    // N: 1 Low (4 pts), 2 Med (8 pts), 3 High (10 pts)
    const nVal = labForm.nBracket;
    const nPoints = nVal === '1' ? 4 : nVal === '2' ? 8 : 10;
    const nAdj = nVal === '1' ? '+25% RDF' : nVal === '2' ? '100% RDF' : '-25% RDF';

    // P: 1 Low (4 pts), 2 Med (8 pts), 3 High (10 pts)
    const pVal = labForm.pBracket;
    const pPoints = pVal === '1' ? 4 : pVal === '2' ? 8 : 10;
    const pAdj = pVal === '1' ? '+25% RDF' : pVal === '2' ? '100% RDF' : '-25% RDF';

    // K: 1 Low (4 pts), 2 Med (8 pts), 3 High (10 pts)
    const kVal = labForm.kBracket;
    const kPoints = kVal === '1' ? 4 : kVal === '2' ? 8 : 10;
    const kAdj = kVal === '1' ? '+25% RDF' : kVal === '2' ? '100% RDF' : '-25% RDF';

    // 5. Micronutrients & Secondary (30 points total across 8 elements)
    // Ca (3.75), Mg (3.75), S (3.75), Zn (3.75), Mn (3.75), Fe (3.75), Cu (3.75), B (3.75)
    const micronutrientScores: { name: string; nameTe: string; status: string; statusTe: string; isLow: boolean; remedy: string; remedyTe: string }[] = [];

    // Sulfur
    const sLow = labForm.sBracket === '1';
    micronutrientScores.push({
      name: 'Available Sulfur (S)', nameTe: 'లభ్య గంధకం (S)',
      status: sLow ? 'Deficient (<10 ppm)' : 'Sufficient (>10 ppm)',
      statusTe: sLow ? 'లోపం (<10 ppm)' : 'సరిపడా (>10 ppm)',
      isLow: sLow,
      remedy: sLow ? 'Apply Gypsum @ 50 kg/acre or Bensulf (Sulfur 90%) @ 10 kg/acre.' : 'No action needed.',
      remedyTe: sLow ? 'ఎకరానికి 50 కిలోల జిప్సం లేదా 10 కిలోల బెన్‌సల్ఫ్ వేయండి.' : 'సరిపడా ఉంది.',
    });

    // Zinc
    const znLow = labForm.znBracket === '1';
    micronutrientScores.push({
      name: 'Zinc (Zn)', nameTe: 'జింక్ (Zn)',
      status: znLow ? 'Deficient (<0.5 ppm)' : 'Sufficient (≥0.5 ppm)',
      statusTe: znLow ? 'లోపం (<0.5 ppm)' : 'సరిపడా (≥0.5 ppm)',
      isLow: znLow,
      remedy: znLow ? 'Soil apply Zinc Sulfate 21% @ 10 kg/acre or 33% @ 5 kg/acre; or spray 0.2% Zn-EDTA.' : 'No action needed.',
      remedyTe: znLow ? 'ఎకరానికి జింక్ సల్ఫేట్ 21% 10 కిలోలు లేదా 33% 5 కిలోలు వేయండి లేదా 0.2% జింక్ స్ప్రే చేయండి.' : 'సరిపడా ఉంది.',
    });

    // Iron
    const feLow = labForm.feBracket === '1';
    micronutrientScores.push({
      name: 'Iron (Fe)', nameTe: 'ఇనుము (Fe)',
      status: feLow ? 'Deficient (<3.7 ppm)' : 'Sufficient (≥3.7 ppm)',
      statusTe: feLow ? 'లోపం (<3.7 ppm)' : 'సరిపడా (≥3.7 ppm)',
      isLow: feLow,
      remedy: feLow ? 'Foliar spray Ferrous Sulfate @ 5 g + Citric acid @ 1 g per litre twice at 10-day intervals.' : 'No action needed.',
      remedyTe: feLow ? 'లీటరు నీటికి 5 గ్రాముల అన్నభేది (FeSO4) + 1 గ్రాము నిమ్మ ఉప్పు కలిపి 10 రోజుల వ్యవధిలో రెండుసార్లు పిచికారీ చేయండి.' : 'సరిపడా ఉంది.',
    });

    // Boron
    const bLow = labForm.bBracket === '1';
    micronutrientScores.push({
      name: 'Boron (B)', nameTe: 'బోరాన్ (B)',
      status: bLow ? 'Deficient (<0.5 ppm)' : 'Sufficient (≥0.5 ppm)',
      statusTe: bLow ? 'లోపం (<0.5 ppm)' : 'సరిపడా (≥0.5 ppm)',
      isLow: bLow,
      remedy: bLow ? 'Soil apply Borax @ 2-3 kg/acre or foliar spray Solubor (Boron 20%) @ 1-1.5 g/L at pre-flowering.' : 'No action needed.',
      remedyTe: bLow ? 'ఎకరానికి 2-3 కిలోల బోరాక్స్ నేలలో వేయండి లేదా పూతకు ముందు లీటరుకు 1.5 గ్రాముల బోరాన్ 20% పిచికారీ చేయండి.' : 'సరిపడా ఉంది.',
    });

    // Calcium
    const caLow = labForm.caBracket === '1';
    // Magnesium
    const mgLow = labForm.mgBracket === '1';
    // Manganese
    const mnLow = labForm.mnBracket === '1';
    // Copper
    const cuLow = labForm.cuBracket === '1';

    let microPoints = 30;
    if (sLow) microPoints -= 5;
    if (znLow) microPoints -= 6;
    if (feLow) microPoints -= 5;
    if (bLow) microPoints -= 5;
    if (caLow) microPoints -= 3;
    if (mgLow) microPoints -= 2;
    if (mnLow) microPoints -= 2;
    if (cuLow) microPoints -= 2;
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
  }, [labForm, t]);

  // Mode 2: Field Indicators Scoring
  const fieldScoreDetails = useMemo(() => {
    // 10 indicators, each scored 1 = 10 pts, 2 = 6 pts, 3 = 2 pts
    const scoreItem = (val: number) => (val === 1 ? 10 : val === 2 ? 6 : 2);

    const physScoreRaw =
      scoreItem(fieldState.soilStructure) +
      scoreItem(fieldState.drainage) +
      scoreItem(fieldState.waterHolding) +
      scoreItem(fieldState.compaction) +
      scoreItem(fieldState.erosion);
    const physPercent = Math.round((physScoreRaw / 50) * 100);

    const bioScoreRaw =
      scoreItem(fieldState.organicMatter) +
      scoreItem(fieldState.earthworms) +
      scoreItem(fieldState.cropCondition) +
      scoreItem(fieldState.microbial) +
      scoreItem(fieldState.rootGrowth);
    const bioPercent = Math.round((bioScoreRaw / 50) * 100);

    const totalScore = Math.round((physScoreRaw + bioScoreRaw)); // Max 100

    return {
      physScoreRaw,
      physPercent,
      bioScoreRaw,
      bioPercent,
      totalScore,
    };
  }, [fieldState]);

  // Active overall score based on current tab
  const activeScore = useMemo(() => {
    if (activeTab === 'test-based') return labScoreDetails.totalLabScore;
    if (activeTab === 'indicator-based') return fieldScoreDetails.totalScore;
    // Advisory tab shows average or weighted score
    return Math.round((labScoreDetails.totalLabScore + fieldScoreDetails.totalScore) / 2);
  }, [activeTab, labScoreDetails.totalLabScore, fieldScoreDetails.totalScore]);

  // Overall Soil Health Tier
  const healthTier = useMemo(() => {
    if (activeScore >= 80) {
      return {
        labelEn: 'Healthy / High Fertility',
        labelTe: 'ఆరోగ్యకరమైన సారవంతమైన నేల',
        color: 'text-emerald-700 dark:text-emerald-300',
        badgeBg: 'bg-emerald-500 text-white',
        border: 'border-emerald-300 dark:border-emerald-800',
        cardBg: 'from-emerald-500/10 via-emerald-500/5 to-teal-500/10',
        icon: ShieldCheck,
        summaryEn: 'Soil biological, physical and chemical parameters are in excellent harmony. Balanced maintenance is recommended.',
        summaryTe: 'మట్టి భౌతిక, రసాయన మరియు జీవ లక్షణాలు సమతుల్యంగా ఉన్నాయి. క్రమం తప్పకుండా సాధారణ పోషణ కొనసాగించండి.',
      };
    }
    if (activeScore >= 60) {
      return {
        labelEn: 'Moderately Healthy / Good',
        labelTe: 'మధ్యస్థ సారవంతమైన నేల',
        color: 'text-lime-700 dark:text-lime-300',
        badgeBg: 'bg-lime-600 text-white',
        border: 'border-lime-300 dark:border-lime-800',
        cardBg: 'from-lime-500/10 via-amber-500/5 to-emerald-500/10',
        icon: Sparkles,
        summaryEn: 'Soil is generally productive but has mild nutrient deficiencies or minor physical constraints.',
        summaryTe: 'నేల ఉత్పాదకత సాధారణంగా ఉంది కానీ కొన్ని సూక్ష్మ పోషక లోపాలు లేదా సేంద్రీయ పదార్థ లోపం ఉంది.',
      };
    }
    if (activeScore >= 40) {
      return {
        labelEn: 'Degraded / Sub-optimal',
        labelTe: 'సమస్యాత్మక / క్షీణించిన నేల',
        color: 'text-amber-700 dark:text-amber-300',
        badgeBg: 'bg-amber-600 text-white',
        border: 'border-amber-300 dark:border-amber-800',
        cardBg: 'from-amber-500/10 via-orange-500/5 to-yellow-500/10',
        icon: AlertTriangle,
        summaryEn: 'Soil shows substantial degradation (acidity, compaction, or severe humus depletion). Systematic soil reclamation is required.',
        summaryTe: 'నేల గణనీయంగా క్షీణించింది (ఆమ్లత, గట్టిపడటం లేదా కర్బన లోపం). క్రమబద్ధమైన సవరణ చర్యలు తక్షణావశ్యకం.',
      };
    }
    return {
      labelEn: 'Critical / Poor Quality',
      labelTe: 'అత్యంత సమస్యాత్మక నేల',
      color: 'text-rose-700 dark:text-rose-300',
      badgeBg: 'bg-rose-600 text-white',
      border: 'border-rose-300 dark:border-rose-800',
      cardBg: 'from-rose-500/10 via-red-500/5 to-orange-500/10',
      icon: ShieldAlert,
      summaryEn: 'Severe soil degradation threatening crop viability (strong salinity/alkalinity or extreme acidity). Requires immediate reclamation protocol.',
      summaryTe: 'పంట దిగుబడిని తీవ్రంగా దెబ్బతీసే స్థితి (చౌడు, ఉప్పు లేదా తీవ్ర ఆమ్లత). తక్షణ పునరుద్ధరణ చర్యలు చేపట్టాలి.',
    };
  }, [activeScore]);

  // Speedometer Needle Angle: 0 score = -90deg, 100 score = +90deg
  const needleAngle = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, activeScore));
    return -90 + (clamped / 100) * 180;
  }, [activeScore]);

  // Soil Type Badge based on Acidity (Soil Reaction / pH)
  const soilTypeBadge = useMemo(() => {
    switch (labForm.phBracket) {
      case '1':
        return {
          typeEn: 'Strongly Acidic Soil',
          typeTe: 'తీవ్ర ఆమ్ల నేల (Strongly Acidic)',
          badgeTextEn: 'pH < 5.5 · Strongly Acidic',
          badgeTextTe: 'pH < 5.5 · తీవ్ర ఆమ్లత',
          pillBorder: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800',
          badgeBg: 'bg-rose-600 text-white',
          remedySummaryEn: 'High acidity limits Phosphorus and Micronutrient availability. Agricultural lime or dolomite application is required.',
          remedySummaryTe: 'తీవ్ర ఆమ్లత వలన భాస్వరం మరియు సూక్ష్మ పోషకాలు అందవు. వ్యవసాయ సున్నం లేదా డోలమైట్ వాడాలి.',
          icon: AlertTriangle,
        };
      case '2':
        return {
          typeEn: 'Moderately Acidic Soil',
          typeTe: 'మధ్యస్థ ఆమ్ల నేల (Moderately Acidic)',
          badgeTextEn: 'pH 5.6 - 6.0 · Moderately Acidic',
          badgeTextTe: 'pH 5.6 - 6.0 · మధ్యస్థ ఆమ్లత',
          pillBorder: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
          badgeBg: 'bg-amber-600 text-white',
          remedySummaryEn: 'Sub-optimal soil reaction. Light to moderate lime application and rock phosphate are recommended.',
          remedySummaryTe: 'మధ్యస్థ ఆమ్ల స్థితి. మితమైన సున్నం మరియు భాస్వరం కోసం రాక్ ఫాస్ఫేట్ వాడండి.',
          icon: AlertTriangle,
        };
      case '3':
        return {
          typeEn: 'Slightly Acidic Soil',
          typeTe: 'స్వల్ప ఆమ్ల నేల (Slightly Acidic)',
          badgeTextEn: 'pH 6.1 - 6.5 · Slightly Acidic',
          badgeTextTe: 'pH 6.1 - 6.5 · స్వల్ప ఆమ్లత',
          pillBorder: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800',
          badgeBg: 'bg-teal-600 text-white',
          remedySummaryEn: 'Mild acidity, near neutral range. Favorable for most field crops; organic compost maintains balance.',
          remedySummaryTe: 'స్వల్ప ఆమ్లత, దాదాపు తటస్థం. అధిక పంటలకు అనుకూలం; సేంద్రీయ ఎరువులతో సరిపోతుంది.',
          icon: Leaf,
        };
      case '5':
        return {
          typeEn: 'Alkaline / Sodic Soil',
          typeTe: 'క్షార / చౌడు నేల (Alkaline / Sodic)',
          badgeTextEn: 'pH > 7.5 · Alkaline / Sodic',
          badgeTextTe: 'pH > 7.5 · క్షార / చౌడు నేల',
          pillBorder: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800',
          badgeBg: 'bg-purple-600 text-white',
          remedySummaryEn: 'High sodium/calcium carbonates causing crusting. Agricultural gypsum and deep flushing are required.',
          remedySummaryTe: 'అధిక లవణాలు మరియు బిగుసుకుపోయే నేల. వ్యవసాయ జిప్సం వేసి మంచి నీటితో నింపడం అవసరం.',
          icon: AlertTriangle,
        };
      case '4':
      default:
        return {
          typeEn: 'Neutral / Ideal Soil',
          typeTe: 'తటస్థ / అనువైన నేల (Neutral / Ideal)',
          badgeTextEn: 'pH 6.5 - 7.5 · Neutral / Optimum',
          badgeTextTe: 'pH 6.5 - 7.5 · తటస్థ / ఆదర్శం',
          pillBorder: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
          badgeBg: 'bg-emerald-600 text-white',
          remedySummaryEn: 'Ideal soil reaction. Optimal availability for all major and micro nutrients with high biological activity.',
          remedySummaryTe: 'ఆదర్శవంతమైన నేల ప్రతిచర్య. ప్రధాన మరియు సూక్ష్మ పోషకాలు సమృద్ధిగా అందుతాయి.',
          icon: ShieldCheck,
        };
    }
  }, [labForm.phBracket]);

  // Build Share text for WhatsApp and Clipboard with bold formatting
  const shareText = useMemo(() => {
    const separator = '━━━━━━━━━━━━━━━━━━━━';
    const lines = [
      `🌱 *${t('AGRONIX — Soil Health Meter Report', 'అగ్రోనిక్స్ — మట్టి ఆరోగ్య మీటర్ నివేదిక')}*`,
      separator,
      `🎯 *${t('SOIL HEALTH SCORE', 'మట్టి ఆరోగ్య స్కోరు')}:* *${activeScore}/100* (*${language === 'te' ? healthTier.labelTe : healthTier.labelEn}*)`,
      `🧪 *${t('TYPE OF SOIL', 'నేల రకం')}:* *${language === 'te' ? soilTypeBadge.typeTe : soilTypeBadge.typeEn}*`,
      `🔬 *${t('Soil Reaction (pH)', 'మట్టి ప్రతిచర్య')}:* ${language === 'te' ? soilTypeBadge.badgeTextTe : soilTypeBadge.badgeTextEn}`,
      `📋 *${t('Assessment Mode', 'విశ్లేషణ విధానం')}:* ${activeTab === 'test-based' ? t('Lab Test Based (Chemical)', 'రసాయన పరీక్ష ఆధారితం') : activeTab === 'indicator-based' ? t('Field Indicators Based (Visual)', 'క్షేత్ర లక్షణాల ఆధారితం') : t('Combined Evaluation', 'సమగ్ర మూల్యాంకనం')}`,
      separator,
      `📊 *${t('KEY CHEMICAL PARAMETERS', 'ప్రధాన రసాయన పరీక్ష ఫలితాలు')}*`,
      `• *pH (Reaction):* ${labScoreDetails.phStatus}`,
      `• *EC (Salinity):* ${labScoreDetails.ecStatus}`,
      `• *Organic Carbon (OC):* ${labScoreDetails.ocStatus}`,
      `• *Available Nitrogen (N):* ${labScoreDetails.nAdj}`,
      `• *Available Phosphorus (P):* ${labScoreDetails.pAdj}`,
      `• *Available Potassium (K):* ${labScoreDetails.kAdj}`,
      separator,
      `🩺 *${t('ACTIONABLE RECLAMATION & ADVISORY', 'ముఖ్య సవరణలు & సిఫార్సులు')}*`,
      `1️⃣ *${t('Soil Reaction Remedy', 'నేల ఆమ్లత / పీహెచ్ సవరణ')}:*`,
      `   ${labScoreDetails.phRemedy}`,
      ``,
      `2️⃣ *${t('Organic Matter Restoration', 'సేంద్రీయ కర్బన వృద్ధి')}:*`,
      `   ${labScoreDetails.ocRemedy}`,
      separator,
      `🌾 *${t('Evaluated on AGRONIX Agriculture Platform', 'అగ్రోనిక్స్ వ్యవసాయ పోర్టల్ ద్వారా విశ్లేషించబడింది')}*`,
      `🌐 www.agronix.in`,
    ];
    return lines.join('\n');
  }, [activeScore, healthTier, soilTypeBadge, activeTab, labScoreDetails, language, t]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      showSuccess(t('Report Copied', 'నివేదిక కాపీ అయింది'), t('Summary copied to clipboard.', 'సారాంశం క్లిప్‌బోర్డ్‌కు కాపీ చేయబడింది.'));
    } catch {
      setCopied(false);
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 print:space-y-2">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 pt-3 pb-1 sm:px-6 lg:px-8 print:hidden">
        {showCompactHeader ? (
          <CompactToolkitHeader
            icon={FlaskConical}
            eyebrow={t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
            title={t('Soil Health Meter', 'మట్టి ఆరోగ్య మీటర్')}
            subtitle={t(
              'Evaluate laboratory soil tests & field visual indicators with instant rating gauge and soil reclamation advisory.',
              'రసాయన పరీక్ష మరియు క్షేత్ర స్థాయి లక్షణాల ఆధారంగా మట్టి ఆరోగ్య స్కోర్ మరియు సమగ్ర సవరణ సిఫార్సులు పొందండి.'
            )}
            onBack={() => navigate('/officer-toolkit/farm-calculators')}
            actions={<LanguageToggle language={language} onClick={toggleLanguage} accent="emerald" />}
            className="mb-1"
          />
        ) : (
          <section className="relative overflow-hidden rounded-2xl border border-teal-300/60 bg-gradient-to-br from-teal-700 via-emerald-700 to-green-800 p-3.5 sm:p-4 text-white shadow-md dark:border-teal-700/60">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-white/30 via-white/70 to-white/30" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                <BackButton onClick={() => navigate('/officer-toolkit/farm-calculators')} tone="solid" className="mt-1 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-sm ring-1 ring-white/25 backdrop-blur-xs text-white mt-0.5">
                      <FlaskConical className="h-5 w-5 sm:h-5.5 sm:w-5.5 text-white" aria-label="Soil Health Meter" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-teal-100 mb-0.5">
                        {t('Farm Calculators', 'వ్యవసాయ కాలిక్యులేటర్లు')}
                      </p>
                      <h1 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug tracking-tight">
                        {t('Soil Health Meter', 'మట్టి ఆరోగ్య మీటర్')}
                      </h1>
                      <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/90 leading-snug max-w-3xl">
                        {t(
                          'Comprehensive soil health index based on standard Soil Health Card parameters.',
                          'సాయిల్ హెల్త్ కార్డ్ ప్రమాణాల ఆధారిత సమగ్ర మట్టి ఆరోగ్య మీటర్.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-start pt-1">
                <LanguageToggle language={language} onClick={toggleLanguage} tone="solid" />
              </div>
            </div>
          </section>
        )}
      </div>

      <div className="mx-auto max-w-7xl space-y-4 px-4 pb-8 sm:px-6 lg:px-8">
        {/* Tab Selector: Mode 1 vs Mode 2 vs Advisory & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 gap-2 pb-1 sm:pb-0 print:hidden">
          <div className="flex overflow-x-auto space-x-1 sm:space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('test-based')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-black border-b-2 transition ${
              activeTab === 'test-based'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <TestTube className="h-4 w-4" />
            {t('1. Soil Test Based (Lab Report)', '1. రసాయన పరీక్ష ఆధారితం (ల్యాబ్ రిపోర్ట్)')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('indicator-based')}
            className={`flex items-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-black border-b-2 transition ${
              activeTab === 'indicator-based'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            {t('2. Field Indicators (Visual)', '2. క్షేత్ర స్థాయి లక్షణాలు (ప్రత్యక్ష పరిశీలన)')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('advisory')}
            className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-black border-b-2 whitespace-nowrap transition ${
              activeTab === 'advisory'
                ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sprout className="h-4 w-4" />
            {t('3. Comprehensive Advisory & Reclamation', '3. సమగ్ర సవరణలు & సిఫార్సులు')}
          </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-fit self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 mb-1 sm:mb-0 shrink-0"
          >
            <RotateCcw className={`h-3 w-3 transition-transform duration-500 ${isResetting ? 'animate-spin' : ''}`} />
            {t('Reset All', 'అన్నీ రీసెట్ చేయండి')}
          </button>
        </div>

        {/* TAB 1: SOIL TEST BASED EVALUATION */}
        {activeTab === 'test-based' && (
          <div className="space-y-4">
            {/* Primary Chemical Parameters Section */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-teal-600" />
                    {t('Primary Soil Reaction & Major Nutrients', 'మట్టి ప్రతిచర్య & ప్రధాన పోషకాలు')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Select laboratory value bracket or standard Soil Health Card test result.', 'ప్రయోగశాల సాయిల్ హెల్త్ కార్డులో నమోదైన విలువను ఎంచుకోండి.')}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">6 Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Soil Reaction (pH) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Soil Reaction (pH)', 'మట్టి ప్రతిచర్య (pH)')}
                    </label>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${labScoreDetails.phColor}`}>
                      {labScoreDetails.phStatus}
                    </span>
                  </div>
                  <select
                    value={labForm.phBracket}
                    onChange={(e) => updateLab('phBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 5.5 — Strongly Acidic', '5.5 కంటే తక్కువ — తీవ్ర ఆమ్ల నేల')}</option>
                    <option value="2">{t('5.6 to 6.0 — Moderately Acidic', '5.6 నుండి 6.0 — మధ్యస్థ ఆమ్ల నేల')}</option>
                    <option value="3">{t('6.1 to 6.5 — Slightly Acidic', '6.1 నుండి 6.5 — స్వల్ప ఆమ్ల నేల')}</option>
                    <option value="4">{t('6.5 to 7.5 — Neutral / Ideal', '6.5 నుండి 7.5 — తటస్థ / అనువైన నేల')}</option>
                    <option value="5">{t('Above 7.5 — Alkaline / Sodic', '7.5 కంటే ఎక్కువ — క్షార / చౌడు నేల')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labScoreDetails.phRemedy}
                  </p>
                </div>

                {/* 2. Electrical Conductivity (EC) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Electrical Conductivity (EC - dS/m)', 'విద్యుత్ వాహకత (EC - dS/m)')}
                    </label>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${labScoreDetails.ecColor}`}>
                      {labScoreDetails.ecStatus}
                    </span>
                  </div>
                  <select
                    value={labForm.ecBracket}
                    onChange={(e) => updateLab('ecBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 1.0 dS/m — Normal / Non-saline', '1.0 dS/m కంటే తక్కువ — సాధారణం')}</option>
                    <option value="2">{t('1.0 to 3.0 dS/m — Medium / Critical', '1.0 నుండి 3.0 dS/m — మధ్యస్థ లవణీయత')}</option>
                    <option value="3">{t('Above 3.0 dS/m — High / Injurious', '3.0 dS/m కంటే ఎక్కువ — తీవ్ర లవణీయత')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labScoreDetails.ecRemedy}
                  </p>
                </div>

                {/* 3. Organic Carbon (%) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Organic Carbon (OC - %)', 'సేంద్రీయ కర్బనం (OC - %)')}
                    </label>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${labScoreDetails.ocColor}`}>
                      {labScoreDetails.ocStatus}
                    </span>
                  </div>
                  <select
                    value={labForm.ocBracket}
                    onChange={(e) => updateLab('ocBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 0.76% — Low', '0.76% కంటే తక్కువ — లోపం')}</option>
                    <option value="2">{t('0.76% to 1.50% — Medium', '0.76% నుండి 1.50% — మధ్యస్థం')}</option>
                    <option value="3">{t('Above 1.50% — High', '1.50% కంటే ఎక్కువ — సమృద్ధి')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labScoreDetails.ocRemedy}
                  </p>
                </div>

                {/* 4. Available Nitrogen (N) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Available Nitrogen (N - kg/ha)', 'లభ్య నత్రజని (N - kg/ha)')}
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 border border-blue-200">
                      {labScoreDetails.nAdj}
                    </span>
                  </div>
                  <select
                    value={labForm.nBracket}
                    onChange={(e) => updateLab('nBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 280 kg/ha — Low (+25% dose)', '280 కంటే తక్కువ — తక్కువ (+25% ఎరువు)')}</option>
                    <option value="2">{t('280 to 560 kg/ha — Medium (100% RDF)', '280 నుండి 560 — మధ్యస్థం (సాధారణ మోతాదు)')}</option>
                    <option value="3">{t('Above 560 kg/ha — High (-25% dose)', '560 కంటే ఎక్కువ — అధికం (-25% ఎరువు తగ్గించండి)')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labForm.nBracket === '1'
                      ? t('Apply 25% extra Nitrogen over recommended fertilizer dose.', 'సిఫార్సు చేసిన నత్రజని కంటే 25% అదనంగా వేయండి.')
                      : t('Standard balanced Nitrogen management with splits.', 'సిఫార్సు ప్రకారం విడతల వారీగా వేయండి.')}
                  </p>
                </div>

                {/* 5. Available Phosphorus (P2O5) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Available Phosphorus (P₂O₅ - kg/ha)', 'లభ్య భాస్వరం (P₂O₅ - kg/ha)')}
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 border border-purple-200">
                      {labScoreDetails.pAdj}
                    </span>
                  </div>
                  <select
                    value={labForm.pBracket}
                    onChange={(e) => updateLab('pBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 10 kg/ha — Low (+25% dose)', '10 కంటే తక్కువ — తక్కువ (+25% ఎరువు)')}</option>
                    <option value="2">{t('10 to 24 kg/ha — Medium (100% RDF)', '10 నుండి 24 — మధ్యస్థం (సాధారణ మోతాదు)')}</option>
                    <option value="3">{t('Above 24 kg/ha — High (-25% dose)', '24 కంటే ఎక్కువ — అధికం (-25% ఎరువు తగ్గించండి)')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labForm.pBracket === '1'
                      ? t('Incorporate PSB (Phosphorus Solubilizing Bacteria) @ 2 kg/acre with compost.', 'పీఎస్‌బీ బయోఫెర్టిలైజర్‌ను 2 కిలోలు పశువుల ఎరువుతో కలిపి వేయండి.')
                      : t('Optimum phosphorus level for vigorous root development.', 'వేరు వ్యవస్థ ఏపుగా పెరగడానికి సరిపడా భాస్వరం ఉంది.')}
                  </p>
                </div>

                {/* 6. Available Potassium (K2O) */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Available Potassium (K₂O - kg/ha)', 'లభ్య పొటాష్ (K₂O - kg/ha)')}
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 border border-emerald-200">
                      {labScoreDetails.kAdj}
                    </span>
                  </div>
                  <select
                    value={labForm.kBracket}
                    onChange={(e) => updateLab('kBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 115 kg/ha — Low (+25% dose)', '115 కంటే తక్కువ — తక్కువ (+25% ఎరువు)')}</option>
                    <option value="2">{t('115 to 275 kg/ha — Medium (100% RDF)', '115 నుండి 275 — మధ్యస్థం (సాధారణ మోతాదు)')}</option>
                    <option value="3">{t('Above 275 kg/ha — High (-25% dose)', '275 కంటే ఎక్కువ — అధికం (-25% ఎరువు తగ్గించండి)')}</option>
                  </select>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {labForm.kBracket === '1'
                      ? t('Apply MOP (Muriate of Potash) in 2 splits for pest & drought resistance.', 'చీడపీడలు, బెట్టను తట్టుకోవడానికి పొటాష్ ఎరువును రెండు దఫాలుగా వేయండి.')
                      : t('Good potash reserves support grain filling and drought tolerance.', 'గింజ బరువు, కాంతి మరియు నాణ్యతకు తగినంత పొటాష్ ఉంది.')}
                  </p>
                </div>
              </div>
            </section>

            {/* Secondary & Micronutrients Section */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <TestTube className="h-4 w-4 text-purple-600" />
                    {t('Secondary & Micronutrients', 'ద్వితీయ మరియు సూక్ష్మ పోషకాలు')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Assess micronutrient sufficiency thresholds to avoid hidden hunger.', 'రహస్య పోషక లోపాలను నివారించడానికి సూక్ష్మ పోషకాలను విశ్లేషించండి.')}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400">8 Elements</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Calcium */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    {t('Available Calcium (Ca - ppm)', 'లభ్య కాల్షియం (Ca - ppm)')}
                  </label>
                  <select
                    value={labForm.caBracket}
                    onChange={(e) => updateLab('caBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('500 - 1000 ppm (Low)', '500 - 1000 ppm (తక్కువ)')}</option>
                    <option value="2">{t('1000 - 1600 ppm (Medium)', '1000 - 1600 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('1600 - 2400 ppm (High)', '1600 - 2400 ppm (సమృద్ధి)')}</option>
                  </select>
                </div>

                {/* Magnesium */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    {t('Available Magnesium (Mg - ppm)', 'లభ్య మెగ్నీషియం (Mg - ppm)')}
                  </label>
                  <select
                    value={labForm.mgBracket}
                    onChange={(e) => updateLab('mgBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('20 - 40 ppm (Low)', '20 - 40 ppm (తక్కువ)')}</option>
                    <option value="2">{t('40 - 80 ppm (Medium)', '40 - 80 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('80 - 180 ppm (High)', '80 - 180 ppm (సమృద్ధి)')}</option>
                  </select>
                </div>

                {/* Sulfur */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Available Sulfur (S - ppm)', 'లభ్య గంధకం (S - ppm)')}
                    </label>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${labForm.sBracket === '1' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {labForm.sBracket === '1' ? t('Deficient', 'లోపం') : t('OK', 'సరిపడా')}
                    </span>
                  </div>
                  <select
                    value={labForm.sBracket}
                    onChange={(e) => updateLab('sBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 10 ppm (Deficient)', '10 ppm కంటే తక్కువ (లోపం)')}</option>
                    <option value="2">{t('Above 10 ppm (Sufficient)', '10 ppm కంటే ఎక్కువ (సరిపడా)')}</option>
                  </select>
                </div>

                {/* Zinc */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Zinc (Zn - ppm)', 'జింక్ (Zn - ppm)')}
                    </label>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${labForm.znBracket === '1' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {labForm.znBracket === '1' ? t('Deficient', 'లోపం') : t('OK', 'సరిపడా')}
                    </span>
                  </div>
                  <select
                    value={labForm.znBracket}
                    onChange={(e) => updateLab('znBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 0.5 ppm (Low)', '0.5 ppm కంటే తక్కువ (లోపం)')}</option>
                    <option value="2">{t('0.5 to 1.0 ppm (Medium)', '0.5 నుండి 1.0 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('Above 1.0 ppm (High)', '1.0 ppm కంటే ఎక్కువ (సమృద్ధి)')}</option>
                  </select>
                </div>

                {/* Manganese */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    {t('Manganese (Mn - ppm)', 'మాంగనీస్ (Mn - ppm)')}
                  </label>
                  <select
                    value={labForm.mnBracket}
                    onChange={(e) => updateLab('mnBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 1.0 ppm (Low)', '1.0 ppm కంటే తక్కువ (తక్కువ)')}</option>
                    <option value="2">{t('1.0 to 3.0 ppm (Medium)', '1.0 నుండి 3.0 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('Above 3.0 ppm (High)', '3.0 ppm కంటే ఎక్కువ (సమృద్ధి)')}</option>
                  </select>
                </div>

                {/* Iron */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Iron (Fe - ppm)', 'ఇనుము (Fe - ppm)')}
                    </label>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${labForm.feBracket === '1' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {labForm.feBracket === '1' ? t('Deficient', 'లోపం') : t('OK', 'సరిపడా')}
                    </span>
                  </div>
                  <select
                    value={labForm.feBracket}
                    onChange={(e) => updateLab('feBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 3.7 ppm (Deficient)', '3.7 ppm కంటే తక్కువ (లోపం)')}</option>
                    <option value="2">{t('Above 3.7 ppm (Sufficient)', '3.7 ppm కంటే ఎక్కువ (సరిపడా)')}</option>
                  </select>
                </div>

                {/* Copper */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 block mb-1">
                    {t('Copper (Cu - ppm)', 'రాగి (Cu - ppm)')}
                  </label>
                  <select
                    value={labForm.cuBracket}
                    onChange={(e) => updateLab('cuBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 0.5 ppm (Low)', '0.5 ppm కంటే తక్కువ (తక్కువ)')}</option>
                    <option value="2">{t('0.5 to 1.0 ppm (Medium)', '0.5 నుండి 1.0 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('Above 1.0 ppm (High)', '1.0 ppm కంటే ఎక్కువ (సమృద్ధి)')}</option>
                  </select>
                </div>

                {/* Boron */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('Boron (B - ppm)', 'బోరాన్ (B - ppm)')}
                    </label>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${labForm.bBracket === '1' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {labForm.bBracket === '1' ? t('Deficient', 'లోపం') : t('OK', 'సరిపడా')}
                    </span>
                  </div>
                  <select
                    value={labForm.bBracket}
                    onChange={(e) => updateLab('bBracket', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="1">{t('Below 0.5 ppm (Low)', '0.5 ppm కంటే తక్కువ (లోపం)')}</option>
                    <option value="2">{t('0.5 to 1.0 ppm (Medium)', '0.5 నుండి 1.0 ppm (మధ్యస్థం)')}</option>
                    <option value="3">{t('Above 1.0 ppm (High)', '1.0 ppm కంటే ఎక్కువ (సమృద్ధి)')}</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: FIELD INDICATORS (VISUAL SOIL ASSESSMENT) */}
        {activeTab === 'indicator-based' && (
          <div className="space-y-4">
            {/* Physical Indicators Card */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="h-4 w-4 text-emerald-600" />
                    {t('A. Physical Indicators (Field Observation)', 'ఎ. భౌతిక లక్షణాలు (క్షేత్ర స్థాయి పరిశీలన)')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Direct tactile and visual examination of soil tilth, drainage, and compaction.', 'నేల ఆకృతి, నీటి ఇంకుడు శక్తి, గడ్డలు మరియు కోత లక్షణాలను ఎంచుకోండి.')}
                  </p>
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                  {fieldScoreDetails.physPercent}% {t('Physical Health', 'భౌతిక ఆరోగ్యం')}
                </span>
              </div>

              <div className="space-y-3">
                {/* 1. Soil Structure */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('1. Soil Structure & Tilth', '1. నేల ఆకృతి మరియు సహజ పొడి పొడి తనం')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.soilStructure === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.soilStructure === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.soilStructure === 1 ? t('Good', 'మంచిది') : fieldState.soilStructure === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.soilStructure === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ss" checked={fieldState.soilStructure === 1} onChange={() => updateField('soilStructure', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Soil breaks easily leaving no clods. Spongy and crumbly.', 'మట్టి సులభంగా విరిగి పొడి పొడిగా ఉంటుంది. మెత్తగా, నడవడానికి సులువుగా ఉంటుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.soilStructure === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ss" checked={fieldState.soilStructure === 2} onChange={() => updateField('soilStructure', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Soil breaks under moderate pressure leaving a few clods.', 'కొంత ఒత్తిడితో విరిగి కొన్ని చిన్న గడ్డలు మిగులుతాయి.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.soilStructure === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ss" checked={fieldState.soilStructure === 3} onChange={() => updateField('soilStructure', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Looks dead. Like brick/concrete, hard intractable clods.', 'ఇటుక లేదా కాంక్రీట్ వలే గట్టిగా ఉంటుంది, దున్నడం చాలా కష్టం.')}</span>
                    </label>
                  </div>
                </div>

                {/* 2. Drainage & Infiltration */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('2. Drainage & Water Infiltration', '2. నీటి పారుదల మరియు ఇంకుడు శక్తి')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.drainage === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.drainage === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.drainage === 1 ? t('Good', 'మంచిది') : fieldState.drainage === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.drainage === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="di" checked={fieldState.drainage === 1} onChange={() => updateField('drainage', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('No water ponding or heavy runoff. Water infiltrates steadily; ideal moisture.', 'నీరు నిలవదు, తేలికగా ఇంకుతుంది. అధిక తేమ లేకుండా తగినంత పదును ఉంటుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.drainage === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="di" checked={fieldState.drainage === 2} onChange={() => updateField('drainage', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Water stands for short periods, then gradually drains.', 'నీరు స్వల్ప సమయం నిలిచి, నెమ్మదిగా ఇంకుతుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.drainage === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="di" checked={fieldState.drainage === 3} onChange={() => updateField('drainage', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Waterlogs for long periods, evaporates rather than draining.', 'రోజుల తరబడి నీరు నిలుస్తుంది, ఇంకడం కంటే ఆవిరైపోతుంది, చిత్తడిగా ఉంటుంది.')}</span>
                    </label>
                  </div>
                </div>

                {/* 3. Water Holding Capacity */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('3. Moisture Retention & Drought Tolerance', '3. తేమ నిలుపుదల సామర్థ్యం')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.waterHolding === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.waterHolding === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.waterHolding === 1 ? t('Good', 'మంచిది') : fieldState.waterHolding === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.waterHolding === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="wh" checked={fieldState.waterHolding === 1} onChange={() => updateField('waterHolding', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Crops seldom suffer from moderate dry spells.', 'స్వల్ప లేదా మధ్యస్థ వర్షాభావ పరిస్థితుల్లో కూడా పంటలు వాడిపోవు.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.waterHolding === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="wh" checked={fieldState.waterHolding === 2} onChange={() => updateField('waterHolding', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Water shortage symptoms after a week without rain.', 'వర్షం లేని ఒక వారం తర్వాత పంటల్లో నీటి ఎద్దడి లక్షణాలు కనిపిస్తాయి.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.waterHolding === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="wh" checked={fieldState.waterHolding === 3} onChange={() => updateField('waterHolding', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Plant stress develops just 2 days after irrigation or rain.', 'తడి ఇచ్చిన లేదా వర్షం పడిన 2 రోజుల్లోనే పంట వాడిపోతుంది.')}</span>
                    </label>
                  </div>
                </div>

                {/* 4. Subsurface Compaction */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('4. Subsurface Compaction / Hardpan', '4. ఉపరితల గట్టిదనం / హార్డ్‌పాన్')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.compaction === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.compaction === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.compaction === 1 ? t('Good', 'మంచిది') : fieldState.compaction === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.compaction === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="sc" checked={fieldState.compaction === 1} onChange={() => updateField('compaction', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Easy penetration of rod/flag beyond tillage depth.', 'కడ్డీ లేదా వేలితో సులభంగా దుక్కి లోతు కంటే కిందికి దించవచ్చు.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.compaction === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="sc" checked={fieldState.compaction === 2} onChange={() => updateField('compaction', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Some resistance to penetrating flag and root growth.', 'కడ్డీని దింపడానికి కొంత ఒత్తిడి అవసరం, వేరు పెరుగుదలకు స్వల్ప అవరోధం.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.compaction === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="sc" checked={fieldState.compaction === 3} onChange={() => updateField('compaction', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Rod bends readily; dense impenetrable hardpan; bent roots.', 'స్పష్టమైన హార్డ్‌పాన్; కడ్డీ వంగిపోతుంది; వేర్లు పక్కలకు వంగి పెరుగుతాయి.')}</span>
                    </label>
                  </div>
                </div>

                {/* 5. Soil Erosion */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('5. Soil Erosion & Runoff Quality', '5. నేల కోత మరియు కొట్టుకుపోవడం')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.erosion === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.erosion === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.erosion === 1 ? t('Good', 'మంచిది') : fieldState.erosion === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.erosion === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="se" checked={fieldState.erosion === 1} onChange={() => updateField('erosion', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('No gullies or rills. Minimal clear runoff.', 'గట్లు, గాడులు లేవు; నీరు తేటగా ఉంటుంది, నేల కోత లేదు.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.erosion === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="se" checked={fieldState.erosion === 2} onChange={() => updateField('erosion', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Few rills or gullies (<2 inches deep). Colored runoff.', 'రెండు అంగుళాల లోపు చిన్న గాడులు, మట్టి రంగు నీరు ప్రవహిస్తుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.erosion === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="se" checked={fieldState.erosion === 3} onChange={() => updateField('erosion', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Large deep gullies (>2 inches); topsoil washed away; muddy runoff.', 'పెద్ద లోతైన గాడులు; పైపొర మట్టి కొట్టుకుపోయి బురద నీరు పారుతుంది.')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Biological Indicators Card */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sprout className="h-4 w-4 text-lime-600" />
                    {t('B. Biological & Ecological Indicators', 'బి. జీవ మరియు పర్యావరణ లక్షణాలు')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('Visual indices of earthworms, soil organic matter, odor, and root health.', 'వానపాముల ఉనికి, నేల రంగు, సహజ వాసన మరియు వేరు వ్యవస్థ ఆరోగ్యం.')}
                  </p>
                </div>
                <span className="text-xs font-black text-lime-700 dark:text-lime-400 bg-lime-50 dark:bg-lime-950/40 px-2 py-0.5 rounded border border-lime-200">
                  {fieldScoreDetails.bioPercent}% {t('Biological Life', 'జీవ వైవిధ్యం')}
                </span>
              </div>

              <div className="space-y-3">
                {/* 6. Organic Matter / Soil Colour */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('6. Organic Matter & Soil Colour', '6. సేంద్రీయ పదార్థం & పైపొర నేల రంగు')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.organicMatter === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.organicMatter === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.organicMatter === 1 ? t('Good', 'మంచిది') : fieldState.organicMatter === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.organicMatter === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="om" checked={fieldState.organicMatter === 1} onChange={() => updateField('organicMatter', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Topsoil clearly defined, distinctly darker than subsoil (humus rich).', 'పైపొర మట్టి స్పష్టంగా, లోపలి పొర కంటే ముదురు రంగులో సేంద్రీయంగా ఉంటుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.organicMatter === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="om" checked={fieldState.organicMatter === 2} onChange={() => updateField('organicMatter', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Surface color moderately closer to subsoil color.', 'పైపొర మట్టి రంగు లోపలి పొరతో సమానంగా దగ్గరగా ఉంటుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.organicMatter === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="om" checked={fieldState.organicMatter === 3} onChange={() => updateField('organicMatter', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Topsoil pale, identical to subsoil color (humus depleted).', 'పైపొర పాలిపోయి, సేంద్రీయ కర్బనం లోపించి లోపలి పొర వలే ఉంటుంది.')}</span>
                    </label>
                  </div>
                </div>

                {/* 7. Earthworms */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('7. Earthworm Activity', '7. వానపాముల ఉనికి & బొరియలు')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.earthworms === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.earthworms === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.earthworms === 1 ? t('Good', 'మంచిది') : fieldState.earthworms === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.earthworms === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ew" checked={fieldState.earthworms === 1} onChange={() => updateField('earthworms', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Abundant earthworms (>5-10 per shovel), burrows and worm casts visible.', 'ఎక్కువగా వానపాములు, వాటి మట్టి బొరియలు మరియు విసర్జితాలు కనిపిస్తాయి.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.earthworms === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ew" checked={fieldState.earthworms === 2} onChange={() => updateField('earthworms', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Few earthworms with occasional casts.', 'అక్కడక్కడా కొన్ని వానపాములు, తక్కువ బొరియలు కనిపిస్తాయి.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.earthworms === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ew" checked={fieldState.earthworms === 3} onChange={() => updateField('earthworms', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('No visible signs of earthworms or biological activity.', 'వానపాములు గానీ వాటి ఆనవాళ్లు గానీ ఏమాత్రం కనిపించవు.')}</span>
                    </label>
                  </div>
                </div>

                {/* 8. Crop Condition */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('8. Crop Vigor & Foliage Condition', '8. పంట ఏపు & ఆకుల రంగు')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.cropCondition === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.cropCondition === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.cropCondition === 1 ? t('Good', 'మంచిది') : fieldState.cropCondition === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.cropCondition === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="cc" checked={fieldState.cropCondition === 1} onChange={() => updateField('cropCondition', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Normal healthy dark green foliage, uniform growth across entire field.', 'పొలమంతా సమృద్ధిగా ముదురు ఆకుపచ్చ రంగుతో సమానమైన ఏపుగా పెరుగుదల.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.cropCondition === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="cc" checked={fieldState.cropCondition === 2} onChange={() => updateField('cropCondition', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Some uneven or stunted patches, slight discoloration.', 'కొంత అసమాన పెరుగుదల, అక్కడక్కడా లేత పసుపు రంగు ఆకులు.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.cropCondition === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="cc" checked={fieldState.cropCondition === 3} onChange={() => updateField('cropCondition', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Persistent poor growth, severe chlorosis and patchy stand.', 'తీవ్రమైన ఎదుగుదల లోపం, పాలిపోయిన మొక్కలు మరియు నాసిరకం పైరు.')}</span>
                    </label>
                  </div>
                </div>

                {/* 9. Microbial Activity & Odor */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('9. Microbial Activity & Residue Decay', '9. సూక్ష్మజీవుల చర్య & నేల వాసన')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.microbial === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.microbial === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.microbial === 1 ? t('Good', 'మంచిది') : fieldState.microbial === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.microbial === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ma" checked={fieldState.microbial === 1} onChange={() => updateField('microbial', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Residue in active decomposition stages; sweet earthy forest aroma.', 'పంట వ్యర్థాలు చక్కగా కుళ్లుతూ, మధురమైన అడవి మట్టి సువాసన ఉంటుంది.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.microbial === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ma" checked={fieldState.microbial === 2} onChange={() => updateField('microbial', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Some residues slowly decomposing, mild faint odor.', 'వ్యర్థాలు నెమ్మదిగా కుళ్లుతాయి, స్వల్పమైన సహజ వాసన.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.microbial === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="ma" checked={fieldState.microbial === 3} onChange={() => updateField('microbial', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Undecomposed dry straw persisting for months; sour/anaerobic smell.', 'నెలల తరబడి వ్యర్థాలు కుళ్ళకుండా ఉండటం లేదా దుర్వాసన రావడం.')}</span>
                    </label>
                  </div>
                </div>

                {/* 10. Root Growth */}
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                      {t('10. Root Growth & Penetration', '10. వేరు వ్యవస్థ అభివృద్ధి')}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                      fieldState.rootGrowth === 1 ? 'bg-emerald-100 text-emerald-800' : fieldState.rootGrowth === 2 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {fieldState.rootGrowth === 1 ? t('Good', 'మంచిది') : fieldState.rootGrowth === 2 ? t('Medium', 'మధ్యస్థం') : t('Poor', 'సమస్యాత్మకం')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.rootGrowth === 1 ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="rg" checked={fieldState.rootGrowth === 1} onChange={() => updateField('rootGrowth', 1)} className="mt-0.5 text-emerald-600" />
                      <span>{t('Vigorous, deep root network with healthy white root hairs.', 'లోతైన వేరు వ్యవస్థ మరియు ఆరోగ్యకరమైన తెల్లటి పీచు వేర్లు.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.rootGrowth === 2 ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="rg" checked={fieldState.rootGrowth === 2} onChange={() => updateField('rootGrowth', 2)} className="mt-0.5 text-amber-600" />
                      <span>{t('Moderate fine roots, restricted shallow branching.', 'మధ్యస్థ వేర్లు, ఉపరితలానికే పరిమితమైన పెరుగుదల.')}</span>
                    </label>
                    <label className={`flex items-start gap-2 p-2.5 rounded-lg border cursor-pointer text-xs transition ${
                      fieldState.rootGrowth === 3 ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 font-bold' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                    }`}>
                      <input type="radio" name="rg" checked={fieldState.rootGrowth === 3} onChange={() => updateField('rootGrowth', 3)} className="mt-0.5 text-rose-600" />
                      <span>{t('Poor root growth, brown, clubbed, or mushy rotted root balls.', 'నల్లబడిన, కుళ్లిపోయిన లేదా గడ్డకట్టిన బలహీనమైన వేర్లు.')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: COMPREHENSIVE ADVISORY & RECLAMATION */}
        {activeTab === 'advisory' && (
          <div className="space-y-4">
            {/* Remedial Soil Health Action Plan */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  {t('Comprehensive Soil Reclamation & Advisory Protocol', 'సమగ్ర మట్టి సవరణ మరియు సాగు సిఫార్సులు')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t(
                    'Scientifically calibrated soil amendments based on Soil Test Crop Response (STCR) and extension guidelines.',
                    'రసాయన పరీక్ష ఫలితాలు మరియు క్షేత్ర లక్షణాల ఆధారంగా రూపొందించిన పరిష్కారాలు.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Soil Reaction Correction (Acidity / Alkalinity) */}
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <h4 className="text-xs font-black text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                      {t('1. Soil Reaction Amendment (pH Management)', '1. నేల ఉదజసూచిక (pH) సవరణ')}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {labScoreDetails.phRemedy}
                  </p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t('Technical Note:', 'సాంకేతిక గమనిక:')}</span>{' '}
                    {labForm.phBracket === '1' || labForm.phBracket === '2'
                      ? t(
                          'Apply finely powdered agricultural lime (CaCO3) evenly across dry field, mix during preparatory ploughing. Avoid mixing lime with DAP or Urea directly.',
                          'సున్నాన్ని ఆరిన నేలపై సమానంగా చల్లి, దుక్కిలో కలియదున్నాలి. డీఏపీ లేదా యూరియాతో కలిపి ఒకేసారి వేయరాదు.'
                        )
                      : labForm.phBracket === '5'
                      ? t(
                          'Gypsum replaces exchangeable sodium with calcium, forming soluble sodium sulfate that leaches down with drainage water.',
                          'జిప్సం చౌడు నేలలోని సోడియంను కాల్షియంతో భర్తీ చేస్తుంది. నీరు పెట్టి కడిగేయడం ద్వారా ఉప్పు తొలగిపోతుంది.'
                        )
                      : t(
                          'Current pH allows maximum bio-availability of N, P, K and micronutrients.',
                          'ప్రస్తుత పీహెచ్ అన్ని ప్రధాన మరియు సూక్ష్మ పోషకాలు సులభంగా మొక్కకు అందడానికి అత్యంత అనుకూలం.'
                        )}
                  </div>
                </div>

                {/* 2. Organic Carbon & Humus Enhancement */}
                <div className="rounded-xl border border-lime-200 dark:border-lime-800/60 bg-lime-50/40 dark:bg-lime-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-lime-700 dark:text-lime-400" />
                    <h4 className="text-xs font-black text-lime-900 dark:text-lime-200 uppercase tracking-wide">
                      {t('2. Soil Organic Carbon Restoration', '2. సేంద్రీయ కర్బన వృద్ధి చర్యలు')}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {labScoreDetails.ocRemedy}
                  </p>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-lime-100 dark:border-lime-900">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t('Action Plan:', 'కార్యాచరణ:')}</span>{' '}
                    {t(
                      'Broadcast Dhaincha (Sesbania) or Sunnhemp seed @ 15-20 kg/acre with pre-monsoon showers. Plough in at 45-50 days before flowering to add 4-6 tonnes of succulent biomass.',
                      'తొలకరి వర్షాలకు ఎకరానికి 15-20 కిలోల జీలుగా లేదా జనుము విత్తి, 45-50 రోజులకు పూత దశలో కలియదున్నితే 4-6 టన్నుల పచ్చిరొట్ట సేంద్రీయ ఎరువు లభిస్తుంది.'
                    )}
                  </div>
                </div>

                {/* 3. Balanced Chemical Fertilizer Dose Adjustments */}
                <div className="rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-wide">
                      {t('3. STCR Fertilizer Dose Calibrations', '3. పోషకాల ఆధారిత ఎరువుల సవరణ (STCR)')}
                    </h4>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900">
                      <span className="text-[10px] text-slate-500 font-bold block">Nitrogen (N)</span>
                      <span className="font-black text-blue-700 dark:text-blue-300">{labScoreDetails.nAdj}</span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900">
                      <span className="text-[10px] text-slate-500 font-bold block">Phosphorus (P)</span>
                      <span className="font-black text-purple-700 dark:text-purple-300">{labScoreDetails.pAdj}</span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900">
                      <span className="text-[10px] text-slate-500 font-bold block">Potash (K)</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">{labScoreDetails.kAdj}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {t(
                      'Apply full recommended Phosphorus at basal. Split Nitrogen and Potash into 2-3 equal splits to curb volatilization and leaching.',
                      'భాస్వరం మొత్తం ఆఖరి దుక్కిలో వేయాలి. నత్రజని మరియు పొటాష్‌లను 2-3 సమపాళ్లలో పైపాటుగా వేయండి.'
                    )}
                  </p>
                </div>

                {/* 4. Micronutrient Supplementation */}
                <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/30 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                    <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      {t('4. Micronutrient Corrections', '4. సూక్ష్మ పోషక లోపాల నివారణ')}
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {labScoreDetails.micronutrientScores.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 p-1.5 rounded bg-white dark:bg-slate-900 border border-amber-100 dark:border-amber-900/60">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {language === 'te' ? item.nameTe : item.name}:
                          </span>{' '}
                          <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                            {language === 'te' ? item.remedyTe : item.remedy}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black shrink-0 px-1.5 py-0.5 rounded ${item.isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {language === 'te' ? item.statusTe : item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Visual Speedometer & Soil Health Score Gauge */}
        <section className={`rounded-2xl border ${healthTier.border} bg-gradient-to-br ${healthTier.cardBg} bg-white dark:bg-slate-900 p-5 shadow-sm`}>
          <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                {t('Soil Health Diagnostic Result & Meter', 'మట్టి ఆరోగ్య ఫలితం & స్కోర్ మీటర్')}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('Instant Assessment', 'తక్షణ మూల్యాంకనం')}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* SVG Speedometer Gauge */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
              <div className="w-64 relative flex flex-col items-center">
                {/* Gauge Dial SVG */}
                <div className="w-60 h-32 relative flex items-center justify-center">
                  <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                    <defs>
                      <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Outer Track Arc (subtle background) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="16"
                      strokeLinecap="round"
                      className="dark:stroke-slate-800"
                    />

                    {/* Left Round Cap for 0% (Red) */}
                    <circle cx="20" cy="100" r="8" fill="#ef4444" />

                    {/* Red Segment: 0% to 40% (Degraded / Critical) */}
                    <path
                      d="M 20 100 A 80 80 0 0 1 75.3 23.9"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="16"
                    />
                    {/* Amber Segment: 40% to 60% (Sub-optimal) */}
                    <path
                      d="M 75.3 23.9 A 80 80 0 0 1 124.7 23.9"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="16"
                    />
                    {/* Lime Segment: 60% to 80% (Moderately Good) */}
                    <path
                      d="M 124.7 23.9 A 80 80 0 0 1 164.7 53.0"
                      fill="none"
                      stroke="#84cc16"
                      strokeWidth="16"
                    />
                    {/* Emerald Segment: 80% to 100% (Healthy / Optimal) */}
                    <path
                      d="M 164.7 53.0 A 80 80 0 0 1 180 100"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="16"
                    />

                    {/* Right Round Cap for 100% (Emerald) */}
                    <circle cx="180" cy="100" r="8" fill="#10b981" />

                    {/* Scale Reference Labels */}
                    <text x="20" y="116" textAnchor="middle" className="text-[10px] font-black fill-slate-400 dark:fill-slate-500">0</text>
                    <text x="180" y="116" textAnchor="middle" className="text-[10px] font-black fill-slate-400 dark:fill-slate-500">100</text>

                    {/* Indicator Needle with Drop Shadow */}
                    <g
                      filter="url(#needleShadow)"
                      transform={`rotate(${needleAngle}, 100, 100)`}
                      style={{
                        transform: `rotate(${needleAngle}deg)`,
                        transformOrigin: '100px 100px',
                        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    >
                      <polygon
                        points="98.2,100 99.2,26 100.8,26 101.8,100"
                        fill="#0f172a"
                        className="dark:fill-slate-100"
                      />
                      <polygon
                        points="96.5,32 103.5,32 100,20"
                        fill="#0f172a"
                        className="dark:fill-slate-100"
                      />
                    </g>

                    {/* Precision Center Hub Pivot */}
                    <circle cx="100" cy="100" r="8" fill="#0f172a" className="dark:fill-slate-100" />
                    <circle cx="100" cy="100" r="4.5" fill="#38bdf8" />
                    <circle cx="100" cy="100" r="2" fill="#ffffff" />
                  </svg>
                </div>

                {/* Score & Tier Badge - Cleanly positioned below dial baseline */}
                <div className="mt-2 flex flex-col items-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                      {activeScore}
                    </span>
                    <span className="text-sm font-bold text-slate-400 dark:text-slate-500">/ 100</span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black shadow-xs ${healthTier.badgeBg}`}>
                      <healthTier.icon className="h-3.5 w-3.5" />
                      {language === 'te' ? healthTier.labelTe : healthTier.labelEn}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Breakdown & Actionable Overview */}
            <div className="lg:col-span-7 flex flex-col justify-center space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t('Soil Health Diagnostic Status', 'మట్టి ఆరోగ్య నిర్ధారణ స్థితి')}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t('Soil Type:', 'నేల రకం:')}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs border ${soilTypeBadge.pillBorder}`}>
                      <soilTypeBadge.icon className="h-3.5 w-3.5" />
                      {language === 'te' ? soilTypeBadge.badgeTextTe : soilTypeBadge.badgeTextEn}
                    </span>
                  </div>
                </div>
                <h3 className={`text-lg sm:text-xl font-black ${healthTier.color} mt-0.5`}>
                  {language === 'te' ? healthTier.labelTe : healthTier.labelEn} ({activeScore}%)
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {language === 'te' ? healthTier.summaryTe : healthTier.summaryEn}
                </p>
              </div>

              {/* Sub-scores 3-box Grid */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('Lab Chemical', 'రసాయన పరీక్ష')}
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {labScoreDetails.totalLabScore}%
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    {labScoreDetails.totalLabScore >= 75 ? t('Optimal', 'అనుకూలం') : t('Attention', 'గమనించాలి')}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('Physical Stand', 'భౌతిక లక్షణాలు')}
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {fieldScoreDetails.physPercent}%
                  </div>
                  <div className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                    {fieldScoreDetails.physPercent >= 70 ? t('Well Aerated', 'మంచి ఆకృతి') : t('Compacted', 'గట్టిపడినది')}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 p-2.5 text-center">
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('Biological Life', 'జీవ లక్షణాలు')}
                  </div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {fieldScoreDetails.bioPercent}%
                  </div>
                  <div className="text-[10px] text-lime-600 dark:text-lime-400 font-semibold">
                    {fieldScoreDetails.bioPercent >= 70 ? t('Active Flora', 'సమృద్ధిగా') : t('Depleted', 'క్షీణించినది')}
                  </div>
                </div>
              </div>

              {/* Action Buttons: WhatsApp, Copy, Print */}
              <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={shareWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  {t('WhatsApp Share', 'వాట్సాప్ షేర్')}
                </button>
                <button
                  type="button"
                  onClick={copyResult}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t('Copied!', 'కాపీ అయింది!') : t('Copy Report', 'నివేదిక కాపీ')}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {t('Print', 'ప్రింట్')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Printable Footer Notice */}
        <div className="hidden print:block pt-6 border-t border-slate-300 text-center text-xs text-slate-500">
          <p>AGRONIX Agriculture Portal — Soil Health Assessment Card generated for Extension & Advisory.</p>
          <p>Parameters aligned with standard Soil Health Card & Agricultural Extension benchmarks.</p>
        </div>
      </div>
    </div>
  );
}
