export type AdvisoryLang = 'en' | 'te';

export interface AdvisoryEntry {
  keywords: string[];
  keywordsTe?: string[];
  answerEn: string;
  answerTe: string;
}

const advisoryKnowledge: AdvisoryEntry[] = [
  {
    keywords: ['cotton', 'bollworm', 'pink bollworm', 'helicoverpa'],
    keywordsTe: ['పత్తి', 'బోల్ వార్మ్', 'గులాబీ'],
    answerEn:
      'For cotton bollworm: monitor with pheromone traps, remove affected squares/bolls, and apply recommended IPM (Bt or spinosad) as per local agriculture office guidance. Avoid spraying during flowering when bees are active.',
    answerTe:
      'పత్తి బోల్ వార్మ్ కోసం: ఫెరోమోన్ ట్రాప్‌లతో పర్యవేక్షించండి, దెబ్బిన కాయలను తీసివేయండి, స్థానిక వ్యవసాయ అధికారి సూచన ప్రకారం Bt లేదా స్పైనోసాడ్ వంటి IPM ఉపయోగించండి. పుష్పించే సమయంలో తేనెటీగలు ఉన్నప్పుడు పిచికారీ చేయవద్దు.',
  },
  {
    keywords: ['paddy', 'rice', 'blast', 'sheath blight', 'brown planthopper', 'bph'],
    keywordsTe: ['వరి', 'బ్లాస్ట్', 'షీత్', 'బిపిహెచ్', 'నల్ల'],
    answerEn:
      'Paddy blast/sheath blight: ensure balanced nitrogen, avoid dense planting, drain fields periodically. For BPH: avoid excess urea, use light traps, and follow recommended insecticide only above economic threshold.',
    answerTe:
      'వరి బ్లాస్ట్/షీత్ బ్లైట్: సమతుల్య నత్రజని, అతి దట్టమైన నాటు వద్దు, కాలువల ద్వారా నీటిని నియంత్రించండి. BPH కోసం: అతి యూరియా వద్దు, లైట్ ట్రాప్‌లు, ఆర్థిక పరిధి దాటినప్పుడు మాత్రమే మందు.',
  },
  {
    keywords: ['maize', 'corn', 'fall armyworm', 'faw', 'stem borer'],
    keywordsTe: ['మొక్కజొన్న', 'ఆర్మీ వార్మ్', 'స్టెమ్'],
    answerEn:
      'Maize fall armyworm: scout early morning/evening, hand-pick small larvae, destroy egg masses on leaves, and apply biocontrol or recommended chemical per MAO schedule when infestation is high.',
    answerTe:
      'మొక్కజొన్న ఫాల్ ఆర్మీ వార్మ్: ఉదయం/సాయంత్రం పరిశీలించండి, చిన్న లార్వాలను చేతితో తీసివేయండి, ఆకులపై గుడ్లను నాశనం చేయండి, అధిక సోకినప్పుడు MAO షెడ్యూల్ ప్రకారం మందు.',
  },
  {
    keywords: ['leaf curl', 'yellow mosaic', 'virus', 'mosaic', 'leaf curl virus'],
    keywordsTe: ['మోజైక్', 'వైరస్', 'పసుపు', 'ముడత'],
    answerEn:
      'Suspected viral disease (mosaic/leaf curl): remove infected plants, control whitefly/aphid vectors, use virus-free seed, and avoid reusing infected crop residue.',
    answerTe:
      'వైరస్ వ్యాధి (మోజైక్/లీఫ్ కర్ల్): సోకిన మొక్కలను తీసివేయండి, తెలుపు నొండి/ఎడుమ దోమల నియంత్రణ, వైరస్ లేని విత్తనం, సోకిన పంట అవశేషం పునర్వినియోగం చేయవద్దు.',
  },
  {
    keywords: ['fertilizer', 'urea', 'dap', 'npk', 'nutrient deficiency'],
    keywordsTe: ['ఎరువు', 'యూరియా', 'డిఏపీ', 'పోషక'],
    answerEn:
      'Fertilizer guidance: soil test before application; split nitrogen doses for paddy/cotton; apply phosphorus at sowing; potash before flowering. Store fertilizers away from seed/pesticides.',
    answerTe:
      'ఎరువుల సూచన: వేయడానికి ముందు నేల పరీక్ష; వరి/పత్తికి నత్రజనిని విభజించి; డిఏపీ విత్తన సమయంలో; పొటాష్ పుష్పించే ముందు. విత్తన/మందు నుండి ఎరువులను దూరంగా ఉంచండి.',
  },
  {
    keywords: ['drought', 'water stress', 'irrigation', 'dry'],
    keywordsTe: ['కరువు', 'నీటి లోపం', 'పారుదల'],
    answerEn:
      'Water stress: prefer drip/sprinkler where possible, mulch to reduce evaporation, irrigate at cooler hours, and choose short-duration varieties for limited water.',
    answerTe:
      'నీటి ఒత్తిడి: సాధ్యమైతే డ్రిప్/స్ప్రింక్లర్, మల్చ్ తో ఆవిరి తగ్గించండి, చల్లని సమయంలో నీరు, తక్కువ నీటికి చిన్న కాల వైవిధ్యాలు.',
  },
  {
    keywords: ['seed treatment', 'germination', 'seed rate'],
    keywordsTe: ['విత్తన చికిత్స', 'మొలక'],
    answerEn:
      'Seed treatment: treat with recommended fungicide/insecticide before sowing; use certified seed; maintain proper seed rate and depth for uniform emergence.',
    answerTe:
      'విత్తన చికిత్స: వేయడానికి ముందు శిఫారసు చేసిన ఫంగిసైడ్/ఇన్సెక్టిసైడ్; ధృవీకరించిన విత్తనం; సమాన మొలక కోసం సరైన సీడ్ రేట్ మరియు లోతు.',
  },
  {
    keywords: ['soil health', 'ph', 'lime', 'organic', 'compost'],
    keywordsTe: ['నేల ఆరోగ్యం', 'పిహెచ్', 'సేంద్రీయ'],
    answerEn:
      'Soil health: test pH every 2–3 years; apply lime if acidic; add FYM/compost; rotate crops; avoid burning crop residue.',
    answerTe:
      'నేల ఆరోగ్యం: 2–3 సంవత్సరాలకు pH పరీక్ష; అమ్లత్వం ఉంటే చున్నం; FYM/కంపోస్ట్; పంట మార్పిడి; పంట అవశేషం తగలవేయవద్దు.',
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s\u0C00-\u0C7F]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function detectLanguage(text: string): AdvisoryLang {
  return /[\u0C00-\u0C7F]/.test(text) ? 'te' : 'en';
}

export function getAdvisoryReply(question: string, preferredLang?: AdvisoryLang): { lang: AdvisoryLang; text: string } {
  const lang = preferredLang || detectLanguage(question);
  const q = normalize(question);

  let best: AdvisoryEntry | null = null;
  let bestScore = 0;

  for (const entry of advisoryKnowledge) {
    const terms = [...entry.keywords, ...(entry.keywordsTe || [])];
    let score = 0;
    for (const term of terms) {
      const t = normalize(term);
      if (t && q.includes(t)) score += t.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore > 0) {
    return { lang, text: lang === 'te' ? best.answerTe : best.answerEn };
  }

  const fallbackEn =
    'I can help with crop pests, diseases, fertilizers, irrigation, and seed issues. Please mention your crop (cotton, paddy, maize) and symptoms. For urgent field visits contact your MAO office in Tiryani.';
  const fallbackTe =
    'పంట పురుగులు, వ్యాధులు, ఎరువులు, నీరు, విత్తనాలపై సహాయం చేస్తాను. మీ పంట (పత్తి, వరి, మొక్కజొన్న) మరియు లక్షణాలు చెప్పండి. అత్యవసర పరిస్థితిలో తిర్యాని MAO కార్యాలయాన్ని సంప్రదించండి.';

  return { lang, text: lang === 'te' ? fallbackTe : fallbackEn };
}
