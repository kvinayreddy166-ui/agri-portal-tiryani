export type AdvisoryLang = 'en' | 'te';

export const MAO_CONTACT_EN =
  'Mandal Agriculture Officer, Tiryani (contact the agriculture office in Tiryani mandal for field visits and official guidance).';
export const MAO_CONTACT_TE =
  'తిర్యాని మండల వ్యవసాయ అధికారి (అధికారిక సూచనలు మరియు ఫీల్డ్ సందర్శనల కోసం తిర్యాని మండల వ్యవసాయ కార్యాలయాన్ని సంప్రదించండి).';

export interface AdvisoryEntry {
  keywords: string[];
  keywordsTe?: string[];
  answerEn: string;
  answerTe: string;
}

const advisoryKnowledge: AdvisoryEntry[] = [
  {
    keywords: ['cotton', 'bollworm', 'pink bollworm', 'helicoverpa', 'whitefly'],
    keywordsTe: ['పత్తి', 'బోల్ వార్మ్', 'గులాబీ', 'తెలుపు నొండి'],
    answerEn:
      'Cotton: use pheromone traps, remove damaged squares/bolls, follow IPM (Bt, spinosad) as per local advisory. Avoid spraying at peak flowering. For whitefly, conserve natural enemies and follow recommended thresholds.',
    answerTe:
      'పత్తి: ఫెరోమోన్ ట్రాప్‌లు, దెబ్బిన కాయల తొలగింపు, స్థానిక సూచన ప్రకారం IPM (Bt, స్పైనోసాడ్). పుష్పించే సమయంలో పిచికారీ తగ్గించండి. తెలుపు నొండి కోసం సహజ శత్రువులను కాపాడండి.',
  },
  {
    keywords: ['paddy', 'rice', 'blast', 'sheath blight', 'brown planthopper', 'bph', 'leaf folder'],
    keywordsTe: ['వరి', 'బ్లాస్ట్', 'షీత్', 'బిపిహెచ్', 'ఆకు మడత'],
    answerEn:
      'Paddy: balanced nitrogen, proper spacing, timely drainage. Blast/sheath blight—use resistant varieties and fungicides at advisory stage. BPH—avoid excess urea, light traps, spray only above economic threshold.',
    answerTe:
      'వరి: సమతుల్య నత్రజని, సరైన దూరం, సమయానుకూల నీటి నిర్వహణ. బ్లాస్ట్/షీత్ బ్లైట్—నిలావైన రకాలు, సూచించిన దశలో ఫంగిసైడ్. BPH—అతి యూరియా వద్దు, లైట్ ట్రాప్‌లు.',
  },
  {
    keywords: ['maize', 'corn', 'fall armyworm', 'faw', 'stem borer'],
    keywordsTe: ['మొక్కజొన్న', 'ఆర్మీ వార్మ్', 'స్టెమ్'],
    answerEn:
      'Maize: scout morning/evening, destroy egg masses, hand-pick larvae when low. High infestation—follow recommended biocontrol or chemical per mandal schedule. Maintain weed-free fields at establishment.',
    answerTe:
      'మొక్కజొన్న: ఉదయం/సాయంత్రం పరిశీలన, గుడ్ల నాశనం, తక్కువ సోకినప్పుడు లార్వాల చేతితో తొలగింపు. అధిక సోకు—మండల షెడ్యూల్ ప్రకారం మందు/జీవ నియంత్రణ.',
  },
  {
    keywords: ['pulses', 'redgram', 'tur', 'arhar', 'greengram', 'blackgram', 'chickpea'],
    keywordsTe: ['పప్పుధాన్యాలు', 'కంది', 'పెసర', 'మినుము', 'శనగ'],
    answerEn:
      'Pulses: treat seed with Rhizobium + fungicide, ensure drainage, monitor pod borer and wilt. Apply phosphorus at sowing; avoid waterlogging. Use short-duration varieties suited to your season.',
    answerTe:
      'పప్పుధాన్యాలు: విత్తనానికి రైజోబియం+ఫంగిసైడ్, నీటి నిష్కాసన, కాయ పురుగు/వాడల పర్యవేక్షణ. విత్తన సమయంలో భాస్వరం; నీటి నిలుపుదల వద్దు.',
  },
  {
    keywords: ['oilseed', 'groundnut', 'sunflower', 'soybean', 'castor', 'til'],
    keywordsTe: ['నూనె గింజ', 'వేరుశనగ', 'పొద్దు తిరుగుడు', 'సోయాబీన్', 'ఆముదం'],
    answerEn:
      'Oilseeds: calcium application where needed (groundnut), timely sowing, control leaf miner and aphids early. Harvest at physiological maturity to reduce aflatoxin risk in groundnut.',
    answerTe:
      'నూనె గింజలు: అవసరమైతే కాల్షియం (వేరుశనగ), సమయానుకూల విత్తనం, ఆకు మైనర్/ఎడుమ దోమల ప్రారంభ నియంత్రణ. పరిపక్వత సమయంలో కోత.',
  },
  {
    keywords: ['chilli', 'turmeric', 'vegetable', 'tomato', 'onion', 'brinjal', 'horticulture'],
    keywordsTe: ['మిర్చి', 'పసుపు', 'కూరగాయ', 'టమాట', 'ఉల్లి', 'వంకాయ'],
    answerEn:
      'Horticulture crops: raised beds, drip where possible, balanced NPK, regular scouting for thrips, mites, and fruit borer. Follow pre-harvest intervals on pesticides; grade produce for better price.',
    answerTe:
      'తోట పంటలు: ఎత్తైన మంచాలు, సాధ్యమైతే డ్రిప్, సమతుల్య ఎరువులు, త్రిప్స్/తెలుపు తిప్పలు/కాయ పురుగు పర్యవేక్షణ. మందు PH ఇంటర్వల్ పాటించండి.',
  },
  {
    keywords: ['crop management', 'intercrop', 'rotation', 'weed', 'sowing', 'harvest'],
    keywordsTe: ['పంట నిర్వహణ', 'ఇంటర్ క్రాప్', 'పంట మార్పిడి', 'కలుపు', 'విత్తనం', 'కోత'],
    answerEn:
      'Crop management: plan rotation to break pest cycles, use certified seed, follow recommended plant population, timely weeding, and maintain field records for fertilizer and pesticide use.',
    answerTe:
      'పంట నిర్వహణ: పంట మార్పిడి, ధృవీకరించిన విత్తనం, సిఫారసు మొక్క సాంద్రత, సమయానుకూల కలుపు తొలగింపు, ఎరువు/మందు రికార్డులు ఉంచండి.',
  },
  {
    keywords: ['leaf curl', 'yellow mosaic', 'virus', 'mosaic', 'wilt'],
    keywordsTe: ['మోజైక్', 'వైరస్', 'వాడల', 'ముడత'],
    answerEn:
      'Viral/wilt issues: rogue infected plants early, control vectors (whitefly, thrips), use clean seed and resistant varieties. Do not reuse infected crop residue as mulch.',
    answerTe:
      'వైరస్/వాడలు: సోకిన మొక్కలను ముందే తొలగించండి, వాహకాల నియంత్రణ, శుభ్ర విత్తనం, నిలావైన రకాలు. సోకిన అవశేషం మల్చ్‌గా వాడవద్దు.',
  },
  {
    keywords: ['fertilizer', 'urea', 'dap', 'npk', 'micronutrient', 'zinc', 'boron'],
    keywordsTe: ['ఎరువు', 'యూరియా', 'డిఏపీ', 'పోషక', 'జింక్', 'బోరాన్'],
    answerEn:
      'Fertilizers: soil test first; split N for paddy/cotton; DAP at sowing; potash before flowering; apply micronutrients only if deficient. Store away from seed and pesticides.',
    answerTe:
      'ఎరువులు: ముందు నేల పరీక్ష; వరి/పత్తికి విభజిత నత్రజని; డిఏపీ విత్తన సమయంలో; పుష్పించే ముందు పొటాష్; సూక్ష్మ పోషకాలు అవసరమైతే మాత్రమే.',
  },
  {
    keywords: ['drought', 'water stress', 'irrigation', 'rain', 'flood'],
    keywordsTe: ['కరువు', 'నీటి లోపం', 'పారుదల', 'వర్షం', 'వరద'],
    answerEn:
      'Water management: drip/sprinkler saves water; mulch reduces evaporation; irrigate evening/morning; choose drought-tolerant varieties. After floods, drain fields quickly and apply lime where advised.',
    answerTe:
      'నీటి నిర్వహణ: డ్రిప్/స్ప్రింక్లర్, మల్చ్, చల్లని సమయంలో నీరు, కరువు నిలావైన రకాలు. వరద తర్వాత త్వరగా నీటి నిష్కాసన.',
  },
  {
    keywords: ['seed treatment', 'germination', 'seed rate', 'certified seed'],
    keywordsTe: ['విత్తన చికిత్స', 'మొలక', 'ధృవీకరించిన విత్తనం'],
    answerEn:
      'Seed: certified seed, treat with recommended fungicide/insecticide, correct seed rate and depth, and store in cool dry place until sowing.',
    answerTe:
      'విత్తనం: ధృవీకరించిన విత్తనం, శిఫారసు చికిత్స, సరైన సీడ్ రేట్/లోతు, వేయ్యే వరకు ఎండబారని చోట నిల్వ.',
  },
  {
    keywords: ['pesticide', 'spray', 'ipm', 'organic', 'neem', 'biopesticide'],
    keywordsTe: ['పురుగుమందు', 'పిచికారీ', 'ఐపిఎం', 'సేంద్రీయ', 'వేప'],
    answerEn:
      'Pest control: follow IPM—monitoring, cultural practices, then biological/chemical only when needed. Always read label, use PPE, and observe pre-harvest interval.',
    answerTe:
      'పురుగు నియంత్రణ: IPM—పర్యవేక్షణ, సాంస్కృతిక పద్ధతులు, అవసరమైతే మాత్రమే మందు. లేబుల్ చదవండి, రక్షిత దుస్తులు, PH ఇంటర్వల్ పాటించండి.',
  },
  {
    keywords: ['subsidy', 'scheme', 'pm kisan', 'nfsm', 'rabi', 'kharif'],
    keywordsTe: ['సబ్సిడీ', 'పథకం', 'పీఎం కిసాన్', 'రబీ', 'ఖరీఫ్'],
    answerEn:
      `Schemes/subsidies in Tiryani mandal: visit the agriculture office with Aadhaar, passbook, and land documents. Eligibility depends on season and government notifications. ${MAO_CONTACT_EN}`,
    answerTe:
      `తిర్యాని మండల పథకాలు: ఆధార్, పాస్‌బుక్, భూమి పత్రాలతో వ్యవసాయ కార్యాలయాన్ని సంప్రదించండి. ${MAO_CONTACT_TE}`,
  },
  {
    keywords: ['soil health', 'ph', 'lime', 'compost', 'fym', 'organic manure'],
    keywordsTe: ['నేల ఆరోగ్యం', 'పిహెచ్', 'సేంద్రీయ', 'ఎరువులు'],
    answerEn:
      'Soil health: test pH every 2–3 years; lime if acidic; add FYM/compost; crop rotation; incorporate crop residue instead of burning.',
    answerTe:
      'నేల ఆరోగ్యం: 2–3 సంవత్సరాలకు pH పరీక్ష; అమ్లత్వం ఉంటే చున్నం; FYM/కంపోస్ట్; పంట మార్పిడి; పంట అవశేషం తగలవేయవద్దు.',
  },
  {
    keywords: ['storage', 'warehouse', 'post harvest', 'moisture', 'aflatoxin'],
    keywordsTe: ['నిల్వ', 'కోత తర్వాత', 'తేమ'],
    answerEn:
      'Post-harvest: dry grains to safe moisture before storage; clean gunny bags and godowns; protect from rodents; for groundnut/chilli avoid high moisture to prevent mould.',
    answerTe:
      'కోత తర్వాత: ధాన్యాలను సురక్షిత తేమకు ఎండించి నిల్వ; శుభ్ర గోడౌన్/గోనీలు; ఎలుకల నుండి రక్షణ; వేరుశనగ/మిర్చి తేమ తగ్గించండి.',
  },
  {
    keywords: ['machinery', 'tractor', 'custom hiring', 'farm mechanization'],
    keywordsTe: ['యంత్రాలు', 'ట్రాక్టర్', 'అద్దె యంత్రాలు'],
    answerEn:
      'Farm mechanization: use CHC/custom hiring for ploughing and harvesting on time; calibrate seed drills; safety first when operating equipment.',
    answerTe:
      'వ్యవసాయ యాంత్రీకరణ: సమయానుకూల నాగు/కోత కోసం CHC/అద్దె యంత్రాలు; సీడ్ డ్రిల్ క్రమీకరణ; భద్రత మొదట.',
  },
  {
    keywords: ['disease', 'fungal', 'bacterial', 'blight', 'rust', 'smut', 'rot', 'wilt disease'],
    keywordsTe: ['వ్యాధి', 'ఫంగస్', 'బ్యాక్టీరియా', 'బ్లైట్', 'తుప్పు', 'వాడల', 'కుళ్ళు'],
    answerEn:
      'Crop diseases: remove infected plants early, avoid overhead irrigation on foliage, use resistant varieties, rotate crops, and apply recommended fungicide only at the right growth stage. Send samples to the mandal agriculture office if unsure.',
    answerTe:
      'పంట వ్యాధులు: సోకిన మొక్కలను ముందే తొలగించండి, ఆకులపై ఎక్కువ నీరు పోయవద్దు, నిలావైన రకాలు, పంట మార్పిడి, సూచించిన దశలో మాత్రమే ఫంగిసైడ్. సందేహం ఉంటే మండల వ్యవసాయ కార్యాలయానికి నమూనా పంపండి.',
  },
  {
    keywords: ['pest', 'insect', 'larvae', 'aphid', 'thrips', 'mite', 'borer', 'hopper', 'caterpillar'],
    keywordsTe: ['పురుగు', 'కీటకం', 'లార్వా', 'ఎడుమ', 'త్రిప్స్', 'తెలుపు తిప్పలు', 'పోక తొలిగింపు', 'హాపర్'],
    answerEn:
      'Crop pests: scout weekly, use light/pheromone traps, encourage natural enemies, and spray only when pest crosses economic threshold. Combine cultural + biological + chemical methods (IPM).',
    answerTe:
      'పంట పురుగులు: వారంలో ఒకసారి పరిశీలన, లైట్/ఫెరోమోన్ ట్రాప్‌లు, సహజ శత్రువులను కాపాడండి, ఆర్థిక పరిధి దాటినప్పుడు మాత్రమే మందు. IPM (సాంస్కృతిక+జీవ+రసాయన) పాటించండి.',
  },
  {
    keywords: ['cultural practice', 'sowing time', 'spacing', 'deep plough', 'nursery', 'transplant', 'mulching'],
    keywordsTe: ['సాంస్కృతిక', 'విత్తన సమయం', 'దూరం', 'లోతైన నాగు', 'నారు', 'నాటు', 'మల్చ్'],
    answerEn:
      'Cultural practices: timely sowing/transplanting, recommended spacing, deep ploughing in summer, FYM before sowing, timely weeding, and safe irrigation scheduling improve yield and reduce pests/diseases.',
    answerTe:
      'సాంస్కృతిక పద్ధతులు: సమయానుకూల విత్తనం/నాటు, సిఫారసు దూరం, వేసవిలో లోతైన నాగు, విత్తనానికి ముందు FYM, సమయానుకూల కలుపు తొలగింపు, సరైన నీటి నిర్వహణ — దిగుబడి పెరుగుతుంది, పురుగు/వ్యాధి తగ్గుతుంది.',
  },
  {
    keywords: ['nematode', 'root knot', 'root rot', 'damping off'],
    keywordsTe: ['నెమటోడ్', 'వేరు ముడత', 'వేరు కుళ్ళు', 'మొలక కుళ్ళు'],
    answerEn:
      'Soil-borne problems: solarize nursery beds, treat seed, use Trichoderma where advised, avoid waterlogging, and rotate with non-host crops.',
    answerTe:
      'నేల సంబంధిత సమస్యలు: నారు మంచాల ఎండబాట, విత్తన చికిత్స, సూచన ప్రకారం ట్రైకోడర్మా, నీటి నిలుపుదల వద్దు, పంట మార్పిడి.',
  },
  {
    keywords: ['weed', 'herbicide', 'hand weeding', 'interculture'],
    keywordsTe: ['కలుపు', 'కలుపు నాశిని', 'చేతి కలుపు', 'మధ్య జోత'],
    answerEn:
      'Weed management: pre-emergence herbicide where recommended, 1–2 hand weedings, interculture in row crops, and do not let weeds seed in the field.',
    answerTe:
      'కలుపు నిర్వహణ: సూచన ప్రకారం మొలక ముందు మందు, 1–2 సార్లు చేతి కలుపు, వరుస పంటలలో మధ్య జోత, కలుపు గింజలు ఏర్చవద్దు.',
  },
  {
    keywords: ['nutrition spray', 'foliar', 'micronutrient spray', 'yellow leaf'],
    keywordsTe: ['పోషక పిచికారీ', 'ఫోలియర్', 'పసుపు ఆకు'],
    answerEn:
      'Foliar nutrition: apply micronutrient sprays only after deficiency is confirmed; use correct dose and time (morning/evening); mix only compatible chemicals.',
    answerTe:
      'ఫోలియర్ పోషకాలు: లోపం నిర్ధారించిన తర్వాత మాత్రమే సూక్ష్మ పోషక పిచికారీ; సరైన మోతాదు, ఉదయం/సాయంత్రం; అనుకూల మందులు మాత్రమే కలపండి.',
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s\u0C00-\u0C7F]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function detectLanguage(text: string): AdvisoryLang {
  return /[\u0C00-\u0C7F]/.test(text) ? 'te' : 'en';
}

export function getAdvisoryReply(
  question: string,
  preferredLang?: AdvisoryLang
): { lang: AdvisoryLang; text: string } {
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

  const fallbackEn = `I am your Telugu agriculture assistant for Tiryani mandal — crops, pests, diseases, cultural practices, fertilizers, and irrigation. Example: "పత్తిలో తెలుపు నొండి" or "paddy blast control". ${MAO_CONTACT_EN}`;

  const fallbackTe = `నేను తిర్యాని మండల రైతుల సహాయకుడిని — పంటలు, పురుగులు, వ్యాధులు, సాంస్కృతిక పద్ధతులు, ఎరువులు, నీరు. ఉదాహరణ: "వరిలో బ్లాస్ట్", "పత్తి పురుగు", "నారు నిర్వహణ". తెలుగులో అడగండి. ${MAO_CONTACT_TE}`;

  return { lang, text: lang === 'te' ? fallbackTe : fallbackEn };
}
