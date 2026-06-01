/*
  Crop intelligence database
  - Non-destructive replacement for the old document-table style crop page.
  - Stores bilingual production practices, varieties, pests/diseases, control, and image references.
  - Admin can insert/update/delete; authenticated users can view.
*/

CREATE TABLE IF NOT EXISTS public.crop_intelligence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_te text NOT NULL,
  scientific_name text DEFAULT '',
  crop_image_url text DEFAULT '',
  source_pdf_name text DEFAULT '',
  source_pdf_url text DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  risks jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crop_intelligence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view crop intelligence" ON public.crop_intelligence;
CREATE POLICY "Anyone can view crop intelligence"
  ON public.crop_intelligence FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin can insert crop intelligence" ON public.crop_intelligence;
CREATE POLICY "Admin can insert crop intelligence"
  ON public.crop_intelligence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'k.vinayreddy166@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Admin can update crop intelligence" ON public.crop_intelligence;
CREATE POLICY "Admin can update crop intelligence"
  ON public.crop_intelligence FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'k.vinayreddy166@gmail.com'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'k.vinayreddy166@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Admin can delete crop intelligence" ON public.crop_intelligence;
CREATE POLICY "Admin can delete crop intelligence"
  ON public.crop_intelligence FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'k.vinayreddy166@gmail.com'
    )
  );

INSERT INTO public.crop_intelligence
(slug, name_en, name_te, scientific_name, crop_image_url, source_pdf_name, content, risks)
VALUES
(
  'rice',
  'Rice / Paddy',
  'వరి',
  'Oryza sativa',
  '/images/paddy.jpg',
  'rice.pdf',
  $json$
  {
    "soil": {"en":"All normal soils are suitable except problem saline or alkaline fields; water-retentive loams are preferred for paddy.", "te":"చౌడు లేదా క్షార సమస్య గల నేలలు తప్ప సాధారణంగా నీరు నిల్వ ఉండే లోమి నేలలు వరికి అనుకూలం."},
    "duration": {"en":"Short and medium duration varieties are generally 120-150 days.", "te":"స్వల్ప మరియు మధ్యకాలిక రకాలు సాధారణంగా 120-150 రోజులలో పూర్తవుతాయి."},
    "varieties":[
      {"name":"Telangana Sona (RNR 15048)", "duration":"125 days", "notes":{"en":"Fine grain, blast tolerant, suitable for late sowing.", "te":"సన్న బియ్యం, బ్లాస్ట్‌ను తట్టుకునే గుణం, ఆలస్య విత్తనానికి అనుకూలం."}},
      {"name":"Bathukamma (JGL 18047)", "duration":"125 days", "notes":{"en":"Good yield potential and non-shattering grain.", "te":"మంచి దిగుబడి, కోత సమయంలో గింజ రాలడం తక్కువ."}},
      {"name":"MTU 1010 / local notified varieties", "duration":"120-150 days", "notes":{"en":"Use as per local season and water availability.", "te":"స్థానిక కాలం మరియు నీటి లభ్యతను బట్టి ఎంపిక చేయాలి."}}
    ],
    "practices":[
      {"key":"nursery","title":{"en":"Nursery Management","te":"నారు నిర్వహణ"},"body":{"en":"Raise healthy nursery beds; use young seedlings for transplanting and avoid over-aged nursery. Treat seed and maintain uniform water in the nursery.", "te":"ఆరోగ్యకరమైన నారు మడులు తయారు చేసి లేత నారును నాటాలి. ముదురు నారు వాడకూడదు. విత్తన శుద్ధి చేసి నారులో నీటిని సమంగా ఉంచాలి."}},
      {"key":"fertilizer","title":{"en":"Fertilizer Management","te":"ఎరువుల నిర్వహణ"},"body":{"en":"Apply phosphorus and potash basally. Split nitrogen at basal, tillering and panicle initiation. Avoid excess urea because it increases BPH and blast risk.", "te":"భాస్వరం, పొటాష్‌ను మొదటివిడతలో వేయాలి. నత్రజనిని నాటినప్పుడు, పిలక దశలో, కంకి ఏర్పడే దశలో విభజించి వేయాలి. అధిక యూరియా వాడకూడదు."}},
      {"key":"weed","title":{"en":"Weed Control","te":"కలుపు నియంత్రణ"},"body":{"en":"Use recommended pre-emergence herbicide within 3-5 days of transplanting or sowing and follow with hand weeding where required.", "te":"నాటిన లేదా విత్తిన 3-5 రోజుల్లో సిఫారసు చేసిన కలుపు మందు వాడి, అవసరమైతే చేతి కలుపు చేయాలి."}},
      {"key":"irrigation","title":{"en":"Irrigation Management","te":"నీటి నిర్వహణ"},"body":{"en":"Keep shallow water during establishment and active tillering. Avoid drought stress and unnecessary deep standing water.", "te":"నాటిన మొదటి దశలో పలుచగా నీరు ఉంచాలి. పిలక దశలో తగిన తేమ ఉండాలి. నీటి కొరత లేదా అధిక లోతు నీరు నివారించాలి."}}
    ]
  }
  $json$::jsonb,
  $json$
  [
    {"type":"Disease","name":{"en":"Blast","te":"అగ్గి తెగులు"},"symptoms":{"en":"Diamond or spindle shaped lesions with grey center and brown margin on leaves; neck blast causes chaffy grains.", "te":"ఆకులపై బూడిద మధ్య భాగం, గోధుమ అంచులతో వజ్రాకార మచ్చలు; మెడ బ్లాస్ట్ వల్ల గింజలు పొల్లుగా మారుతాయి."},"control":{"en":"Use clean seed, tolerant varieties, balanced nitrogen and recommended fungicide at disease-favouring stage.", "te":"శుభ్రమైన విత్తనం, తట్టుకునే రకాలు, సమతుల్య నత్రజని, అనుకూల దశలో సిఫారసు ఫంగిసైడ్ వాడాలి."},"chemicals":["Tricyclazole 75% WP","Carbendazim 50% WP"],"newChemicals":["Azoxystrobin + Difenoconazole","Trifloxystrobin + Tebuconazole"],"image_url":"https://ipm.ucanr.edu/PMG/IMAGES/P/D-RI-PGRI-FS.002banner.jpg","image_source_url":"https://ipm.ucanr.edu/agriculture/rice/rice-blast/"},
    {"type":"Pest","name":{"en":"Brown Planthopper","te":"సుడి దోమ"},"symptoms":{"en":"Nymphs and adults suck sap from the plant base; severe patches dry as hopper burn.", "te":"పిల్ల పురుగులు, పెద్ద పురుగులు మొక్కల అడుగుభాగంలో రసం పీలుస్తాయి; తీవ్ర దశలో సుడులుగా పొలం ఎండిపోతుంది."},"control":{"en":"Avoid excess nitrogen, drain briefly if needed, conserve natural enemies and spray only above threshold.", "te":"అధిక నత్రజని నివారించాలి, అవసరమైతే తాత్కాలికంగా నీరు వదలాలి, సహజ శత్రువులను కాపాడాలి, పరిమితి దాటితేనే మందు వాడాలి."},"chemicals":["Acephate 75% SP","Carbofuran 3G"],"newChemicals":["Pymetrozine 50% WG","Dinotefuran 20% SG","Triflumezopyrim 10% SC"],"image_url":"https://apps.lucidcentral.org/ppp_v9/images/entities/rice_brown_planthopper_064/nilaparvata_lugens_064_02.jpg","image_source_url":"https://apps.lucidcentral.org/ppp_v9/pdf/web_full/rice_brown_planthopper_064.pdf"}
  ]
  $json$::jsonb
),
(
  'maize',
  'Maize',
  'మొక్కజొన్న',
  'Zea mays',
  '/images/maize.jpg',
  'maize.pdf',
  $json$
  {
    "soil":{"en":"Well-drained fertile soils are suitable; avoid waterlogging.", "te":"నీరు నిల్వ ఉండని సారవంతమైన నేలలు అనుకూలం; నీటి నిల్వ నివారించాలి."},
    "duration":{"en":"Most hybrids mature in 85-120 days.", "te":"చాలా సంకర రకాలు 85-120 రోజుల్లో పండుతాయి."},
    "varieties":[
      {"name":"DHM 111","duration":"90-95 days","notes":{"en":"Tolerant to leaf blight and stalk rot.", "te":"ఆకు ఎండు, కాండం కుళ్లు కొంతవరకు తట్టుకుంటుంది."}},
      {"name":"DHM 117","duration":"95-100 days","notes":{"en":"Good grain type with tolerance to borer and blights.", "te":"మంచి గింజ రకం, కాండం పురుగు మరియు ఎండు తెగుళ్లను కొంతవరకు తట్టుకుంటుంది."}},
      {"name":"DHM 121","duration":"90-95 days","notes":{"en":"Short duration high-yielding hybrid.", "te":"స్వల్పకాలిక అధిక దిగుబడి సంకర రకం."}}
    ],
    "practices":[
      {"key":"nursery","title":{"en":"Sowing","te":"విత్తడం"},"body":{"en":"Direct line sowing with seed drill or planter is preferred; maintain optimum spacing and seed depth.", "te":"సీడ్ డ్రిల్ లేదా ప్లాంటర్‌తో వరుసలలో నేరుగా విత్తడం మంచిది; సరైన దూరం, లోతు పాటించాలి."}},
      {"key":"fertilizer","title":{"en":"Fertilizer Management","te":"ఎరువుల నిర్వహణ"},"body":{"en":"Apply full phosphorus and potash basally; split nitrogen at sowing, knee-high and tasseling stages.", "te":"భాస్వరం, పొటాష్ మొత్తం మొదటివిడతలో వేయాలి. నత్రజనిని విత్తినప్పుడు, మోకాలి ఎత్తు దశలో, మగ పుష్ప దశలో విభజించి వేయాలి."}},
      {"key":"weed","title":{"en":"Weed Control","te":"కలుపు నియంత్రణ"},"body":{"en":"Keep the crop weed-free during the first 30-40 days using pre-emergence herbicide and interculture.", "te":"మొదటి 30-40 రోజులు కలుపు లేకుండా ఉంచాలి; మొలక ముందు మందు మరియు మధ్య జోత చేయాలి."}},
      {"key":"irrigation","title":{"en":"Irrigation Management","te":"నీటి నిర్వహణ"},"body":{"en":"Critical stages are knee-high, tasseling, silking and grain filling.", "te":"మోకాలి ఎత్తు, మగ పుష్పం, సిల్కింగ్, గింజ నిండే దశలు కీలకమైనవి."}}
    ]
  }
  $json$::jsonb,
  $json$
  [
    {"type":"Pest","name":{"en":"Fall Armyworm","te":"ఫాల్ ఆర్మీవార్మ్"},"symptoms":{"en":"Scraped leaves, ragged holes and frass in the whorl.", "te":"ఆకులపై గీతలు, చించుకున్న రంధ్రాలు, మొక్క మధ్యలో విసర్జన కనిపిస్తుంది."},"control":{"en":"Scout early, destroy egg masses, apply whorl-directed spray when larvae are small.", "te":"ప్రారంభ దశలో పరిశీలించాలి, గుడ్ల సమూహాలు నాశనం చేయాలి, చిన్న లార్వా దశలో సిఫారసు మందు వాడాలి."},"chemicals":["Emamectin benzoate 5% SG","Spinosad 45% SC"],"newChemicals":["Chlorantraniliprole 18.5% SC","Spinetoram 11.7% SC"],"image_url":"https://crops.extension.iastate.edu/files/inline-images/fall%20armyworm%20leaf%20feeding%20corn%20John%20C%20French%20Sr..jpg","image_source_url":"https://crops.extension.iastate.edu/encyclopedia/fall-armyworm"}
  ]
  $json$::jsonb
),
(
  'cotton',
  'Cotton',
  'పత్తి',
  'Gossypium hirsutum',
  '/images/cotton.jpg',
  'cotton.pdf',
  $json$
  {
    "soil":{"en":"Deep black cotton soils with good moisture retention are most suitable.", "te":"తేమ నిల్వ ఉండే లోతైన నల్లరేగడి నేలలు పత్తికి అత్యంత అనుకూలం."},
    "duration":{"en":"Cotton generally takes 150-180 days.", "te":"పత్తి సాధారణంగా 150-180 రోజులు పడుతుంది."},
    "varieties":[
      {"name":"Narasimha (NA 1325)","duration":"160-170 days","notes":{"en":"Drought tolerant and tolerant to jassids.", "te":"ఎండను మరియు జాసిడ్లను కొంతవరకు తట్టుకుంటుంది."}},
      {"name":"Srirama (NDLH 1938)","duration":"160-180 days","notes":{"en":"Robust high yielding variety for rainfed conditions.", "te":"వర్షాధార ప్రాంతాలకు అనువైన అధిక దిగుబడి రకం."}},
      {"name":"Recommended Bt hybrids","duration":"150-180 days","notes":{"en":"Use notified hybrids suitable to local season.", "te":"స్థానిక కాలానికి అనుకూలంగా సిఫారసు చేసిన Bt సంకరాలను వాడాలి."}}
    ],
    "practices":[
      {"key":"nursery","title":{"en":"Sowing","te":"విత్తడం"},"body":{"en":"Direct sowing is used; maintain optimum spacing and gap fill early.", "te":"నేరుగా విత్తాలి; సరైన దూరం పాటించి ప్రారంభ దశలో గ్యాప్ ఫిల్లింగ్ చేయాలి."}},
      {"key":"fertilizer","title":{"en":"Fertilizer Management","te":"ఎరువుల నిర్వహణ"},"body":{"en":"Apply fertilizer based on soil test; split nitrogen around 30, 60 and 90 days.", "te":"నేల పరీక్ష ఆధారంగా ఎరువులు వేయాలి; నత్రజనిని 30, 60, 90 రోజుల దశల్లో విభజించి వేయాలి."}},
      {"key":"weed","title":{"en":"Weed Control","te":"కలుపు నియంత్రణ"},"body":{"en":"Use pre-emergence weed control after sowing and interculture during early growth.", "te":"విత్తిన వెంటనే కలుపు నియంత్రణ చేసి, ప్రారంభ దశలో మధ్య జోత చేయాలి."}},
      {"key":"irrigation","title":{"en":"Irrigation Management","te":"నీటి నిర్వహణ"},"body":{"en":"Protect flowering and boll development from moisture stress.", "te":"పూత మరియు కాయ అభివృద్ధి దశల్లో తేమ కొరత లేకుండా చూడాలి."}}
    ]
  }
  $json$::jsonb,
  $json$
  [
    {"type":"Pest","name":{"en":"Pink Bollworm","te":"గులాబీ కాయ పురుగు"},"symptoms":{"en":"Rosette flowers, bored bolls, damaged seed and stained lint.", "te":"రోసెట్ పువ్వులు, కాయల్లో రంధ్రాలు, గింజ నష్టం, పత్తి మచ్చలు కనిపిస్తాయి."},"control":{"en":"Use pheromone traps, remove damaged bolls and follow refuge/IPM practices.", "te":"ఫెరోమోన్ ట్రాపులు పెట్టాలి, దెబ్బతిన్న కాయలు తొలగించాలి, IPM పద్ధతులు పాటించాలి."},"chemicals":["Spinosad 45% SC","Emamectin benzoate 5% SG"],"newChemicals":["Chlorantraniliprole 18.5% SC","Flubendiamide 39.35% SC"],"image_url":"https://www.ars.usda.gov/ARSUserFiles/oc/images/photos/dec20/k10075-6.jpg","image_source_url":"https://www.ars.usda.gov/oc/images/photos/dec20/k10075-6/"}
  ]
  $json$::jsonb
),
(
  'redgram',
  'Redgram / Pigeonpea',
  'కంది',
  'Cajanus cajan',
  '/images/pulses.jpg',
  'redgram.pdf',
  $json$
  {
    "soil":{"en":"Well-drained red sandy loams and black soils are suitable; avoid waterlogging.", "te":"మురుగు నీరు పోయే ఎర్ర చల్కా మరియు నల్లరేగడి నేలలు అనుకూలం; నీటి నిల్వ నివారించాలి."},
    "duration":{"en":"Kharif crop generally 150-180 days; rabi crop 130-140 days.", "te":"ఖరీఫ్‌లో 150-180 రోజులు, రబీలో 130-140 రోజులు పంట కాలం."},
    "varieties":[
      {"name":"PRG 176","duration":"130-140 days","notes":{"en":"Suitable for rabi and gives medium brown bold seed.", "te":"రబీకి అనుకూలం, గింజలు ముదురు గోధుమ రంగులో ఉంటాయి."}},
      {"name":"LRG 41 / local varieties","duration":"150-180 days","notes":{"en":"Use varieties suited to rainfall and soil.", "te":"వర్షపాతం, నేలకు అనుకూల రకాలు వాడాలి."}}
    ],
    "practices":[
      {"key":"nursery","title":{"en":"Sowing","te":"విత్తడం"},"body":{"en":"Direct sowing is followed. Use treated seed and maintain recommended spacing.", "te":"నేరుగా విత్తాలి. శుద్ధి చేసిన విత్తనం వాడి సరైన దూరం పాటించాలి."}},
      {"key":"fertilizer","title":{"en":"Fertilizer Management","te":"ఎరువుల నిర్వహణ"},"body":{"en":"Apply phosphorus at sowing and use Rhizobium seed treatment where recommended.", "te":"విత్తే సమయంలో భాస్వరం వేయాలి; సిఫారసు ప్రకారం రైజోబియం విత్తన శుద్ధి చేయాలి."}},
      {"key":"weed","title":{"en":"Weed Control","te":"కలుపు నియంత్రణ"},"body":{"en":"Keep field weed-free up to 45 days by hand weeding or interculture.", "te":"45 రోజుల వరకు చేతి కలుపు లేదా మధ్య జోతతో కలుపు లేకుండా ఉంచాలి."}},
      {"key":"irrigation","title":{"en":"Irrigation Management","te":"నీటి నిర్వహణ"},"body":{"en":"Avoid waterlogging; provide protective irrigation during flowering and pod filling if needed.", "te":"నీటి నిల్వ వద్దు; పూత మరియు కాయ నిండే దశలో అవసరమైతే రక్షణ తడి ఇవ్వాలి."}}
    ]
  }
  $json$::jsonb,
  $json$
  [
    {"type":"Pest","name":{"en":"Gram Pod Borer","te":"కాయ తొలిచే పురుగు"},"symptoms":{"en":"Larva feeds on pods with head thrust inside; pods show round holes.", "te":"లార్వా తలను కాయలో పెట్టి తింటుంది; కాయలపై గుండ్రని రంధ్రాలు కనిపిస్తాయి."},"control":{"en":"Use sunflower/maize trap or border rows, pheromone traps, bird perches, NPV and need-based insecticide.", "te":"సూర్యకాంతి లేదా మొక్కజొన్నను ట్రాప్/బోర్డర్ పంటగా వాడాలి, ఫెరోమోన్ ట్రాపులు, పక్షి కర్రలు, NPV మరియు అవసరమైనప్పుడు మందు వాడాలి."},"chemicals":["Neem oil 2%","Dimethoate 30% EC","Phosalone 0.07%"],"newChemicals":["Emamectin benzoate 5% SG","Indoxacarb 15.8% SC","Chlorantraniliprole 18.5% SC","Spinosad 45% SC"],"image_url":"https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insect_pul_red%20gram_clip_image002.jpg","image_source_url":"https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insect_pul_red%20gram.html"}
  ]
  $json$::jsonb
),
(
  'greengram',
  'Greengram / Mungbean',
  'పెసర',
  'Vigna radiata',
  '/images/pulses.jpg',
  'greengram.pdf',
  $json$
  {
    "soil":{"en":"Moisture-retentive loamy soils are suitable; avoid saline and waterlogged fields.", "te":"తేమ నిల్వ ఉండే లోమి నేలలు అనుకూలం; చౌడు మరియు నీరు నిలిచే నేలలు పనికిరావు."},
    "duration":{"en":"Most greengram varieties mature in 60-75 days.", "te":"చాలా పెసర రకాలు 60-75 రోజుల్లో పండుతాయి."},
    "varieties":[
      {"name":"WGG 37 (Ekasila)","duration":"60-65 days","notes":{"en":"Shiny green grains and tolerance to yellow mosaic.", "te":"మెరిసే పచ్చ గింజలు, పసుపు మొజాయిక్‌ను కొంతవరకు తట్టుకుంటుంది."}},
      {"name":"MGG 295","duration":"60-65 days","notes":{"en":"Suitable for kharif and rabi.", "te":"ఖరీఫ్, రబీకి అనుకూలం."}},
      {"name":"VBN (Gg) / CO series","duration":"60-75 days","notes":{"en":"Use locally recommended varieties.", "te":"స్థానికంగా సిఫారసు చేసిన రకాలను వాడాలి."}}
    ],
    "practices":[
      {"key":"nursery","title":{"en":"Sowing","te":"విత్తడం"},"body":{"en":"Direct dibbling or line sowing. Treat seed before sowing.", "te":"నేరుగా గుంతలలో లేదా వరుసలలో విత్తాలి. విత్తన శుద్ధి చేయాలి."}},
      {"key":"fertilizer","title":{"en":"Fertilizer Management","te":"ఎరువుల నిర్వహణ"},"body":{"en":"Apply basal NPK and sulphur as recommended. Use Rhizobium, phosphobacteria and micronutrient seed coating where advised.", "te":"సిఫారసు ప్రకారం NPK మరియు సల్ఫర్‌ను మొదటివిడతలో వేయాలి. రైజోబియం, ఫాస్ఫోబాక్టీరియా, సూక్ష్మపోషక విత్తన పూత వాడాలి."}},
      {"key":"weed","title":{"en":"Weed Control","te":"కలుపు నియంత్రణ"},"body":{"en":"Keep weed-free during early growth with one or two weedings.", "te":"ప్రారంభ దశలో ఒకటి లేదా రెండు కలుపులతో పొలం శుభ్రంగా ఉంచాలి."}},
      {"key":"irrigation","title":{"en":"Irrigation Management","te":"నీటి నిర్వహణ"},"body":{"en":"Avoid waterlogging; give light irrigation at flowering and pod filling if dry.", "te":"నీటి నిల్వ వద్దు; ఎండగా ఉంటే పూత మరియు కాయ దశలో తేలికపాటి తడి ఇవ్వాలి."}}
    ]
  }
  $json$::jsonb,
  $json$
  [
    {"type":"Disease","name":{"en":"Yellow Mosaic Virus","te":"పసుపు మొజాయిక్ వైరస్"},"symptoms":{"en":"Yellow-green mosaic patches, puckered leaves, stunting and fewer pods.", "te":"ఆకులపై పసుపు-పచ్చ మచ్చలు, ముడతలు, మొక్క ఎదుగుదల తగ్గడం, కాయలు తక్కువగా రావడం."},"control":{"en":"Use resistant varieties, rogue infected plants early and manage whitefly vectors.", "te":"తట్టుకునే రకాలు వాడాలి, సోకిన మొక్కలను తొలగించాలి, తెల్లదోమ నియంత్రించాలి."},"chemicals":["Neem products","Acephate","Imidacloprid"],"newChemicals":["Thiamethoxam","Pymetrozine","Flonicamid"],"image_url":"https://www.invasive.org/images/768x512/5598935.jpg","image_source_url":"https://www.invasive.org/browse/detail.cfm?imgnum=5598935"},
    {"type":"Disease","name":{"en":"Powdery Mildew","te":"బూడిద తెగులు"},"symptoms":{"en":"White powdery growth on leaves and premature drying.", "te":"ఆకులపై తెల్లని పొడి పొర, తర్వాత ఆకులు ఎండిపోవడం."},"control":{"en":"Use tolerant varieties, avoid dense crop canopy and apply fungicide if disease builds up.", "te":"తట్టుకునే రకాలు వాడాలి, అధిక సాంద్రత నివారించాలి, తెగులు పెరిగితే ఫంగిసైడ్ వాడాలి."},"chemicals":["Wettable sulphur","Carbendazim"],"newChemicals":["Hexaconazole","Tebuconazole","Azoxystrobin"],"image_url":"https://extension.okstate.edu/programs/digital-diagnostics/plant-diseases/site-files/powdery-mildews/powderymildew.jpg","image_source_url":"https://extension.okstate.edu/programs/digital-diagnostics/plant-diseases/powdery-mildews.html"}
  ]
  $json$::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name_en = excluded.name_en,
  name_te = excluded.name_te,
  scientific_name = excluded.scientific_name,
  crop_image_url = excluded.crop_image_url,
  source_pdf_name = excluded.source_pdf_name,
  content = excluded.content,
  risks = excluded.risks,
  updated_at = now();
