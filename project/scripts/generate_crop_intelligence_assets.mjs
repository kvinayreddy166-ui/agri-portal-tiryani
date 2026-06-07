git add .
git commit -m "Update all changes"
git push origin mainimport fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const dirs = [
  'database',
  'database/sql',
  'sql',
  'json',
  'images',
  'src/services',
  'src/hooks',
  'src/components',
  'src/pages/admin',
  'src/pages/crops',
  'public/data',
  'supabase/migrations',
];

for (const dir of dirs) fs.mkdirSync(path.join(root, dir), { recursive: true });

const img = {
  paddy: '/images/paddy.jpg',
  maize: '/images/maize.jpg',
  cotton: '/images/cotton.jpg',
  redgram: '/images/pulses.jpg',
  greengram: '/images/pulses.jpg',
  blast: 'https://agritech.tnau.ac.in/ta/crop_protection/images/crop_diseases/paddy/Blast_sym1.JPG',
  stemBorer: 'https://agritech.tnau.ac.in/crop_protection/images/pestc/ricenew/stemborer/deadheart.jpg',
  bph: 'https://agritech.tnau.ac.in/crop_protection/rice/images/pestc/ricenew/BPH/bph%20damage.jpg',
  fallArmyworm: 'https://agritech.tnau.ac.in/crop_protection/maize/images/fallarmyworm/whorl%20damage.jpg',
  maizeStemBorer: 'https://agritech.tnau.ac.in/crop_protection/rice/images/pestc/maize/stemfly/deadheart.jpg',
  pinkBollworm: 'https://agritech.tnau.ac.in/crop_protection/cotton/Pink%20BollWorm.png',
  whitefly: 'https://agritech.tnau.ac.in/crop_protection/cotton/Whitefly%20damage.jpg',
  redgramPodBorer: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insect_pul_red%20gram_clip_image002.jpg',
  greengramYellowMosaic: 'https://agritech.tnau.ac.in/crop_protection/green_gram_disease/yellow_mosaic_clip_image002.jpg',
  zinc: 'https://www.knowledgebank.irri.org/images/stories/rice-nutrient-disorders/zinc-deficiency-rice.jpg',
};

const sources = {
  pjtsau: 'PJTAU crop PDFs supplied by user: F:/pjtsau crops',
  tnauRiceBlast: 'https://www.agritech.tnau.ac.in/expert_system/paddy/cpdisblast.html',
  tnauRiceStemBorer: 'https://agritech.tnau.ac.in/expert_system/paddy/cppests_SB.html',
  tnauMaizeFaw: 'https://agritech.tnau.ac.in/crop_protection/maize/crop_prot_maize_fall_armyworm.html',
  tnauMaize: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insectpest%20_cereals_maizemain.html',
  tnauCottonPink: 'https://agritech.tnau.ac.in/crop_protection/cotton/crop_prot_crop_insectpest%20_cotton_2.html',
  tnauRedgramPodBorer: 'https://agritech.tnau.ac.in/crop_protection/crop_prot_crop_insect_pul_red%20gram.html',
  tnauGreengramYellowMosaic: 'https://agritech.tnau.ac.in/crop_protection/green_gram_disease/yellow_mosaic.html',
  tnauGreengramVariety: 'https://agritech.tnau.ac.in/agriculture/CropProduction/Pulses/Vbn%205.html',
};

const crops = [
  {
    slug: 'paddy',
    crop_name: 'Paddy',
    name_en: 'Paddy / Rice',
    name_te: 'వరి',
    scientific_name: 'Oryza sativa',
    acreage: 4400000,
    image_url: img.paddy,
    source_pdf_name: 'rice.pdf',
    profile: {
      crop_profile: 'Major kharif and rabi food crop grown under transplanted, wet direct seeded and dry direct seeded systems.',
      crop_profile_te: 'నాట్లు, తడి నేరుగా విత్తడం, పొడి నేరుగా విత్తడం పద్ధతుల్లో సాగు చేసే ప్రధాన ఆహార పంట.',
      soil_requirements: 'Clay loams and water-retentive fertile soils are preferred. Avoid saline, alkaline and poorly drained problem soils unless reclaimed.',
      climate_requirements: 'Warm humid climate with reliable irrigation or rainfall. Sensitive to cold during flowering and grain filling.',
      sowing_time_spacing_land_preparation: 'Nursery from late May to July based on water availability. Transplant at 20 x 15 cm or use line sowing in direct seeded fields after puddling or fine seedbed preparation.',
      seed_rate_seed_treatment: 'Nursery seed 20-25 kg/acre; direct seeded rice 10-12 kg/acre. Treat seed with carbendazim or recommended bioagent and use salt-water seed selection where practiced.',
      crop_production_practices: 'Raise healthy nursery, transplant young seedlings, maintain optimum plant population, use balanced nutrients and timely weed and pest monitoring.',
      harvesting_yield: 'Harvest when 80-85% grains are mature and straw turns yellow. Expected yield is 25-35 q/acre depending on variety and water management.',
      deficiency_symptoms: 'Zinc deficiency causes bronzing and stunted growth; nitrogen deficiency causes pale yellow older leaves; iron toxicity causes brown speckling in poorly drained acidic soils.',
    },
    varieties: [
      ['Telangana Sona (RNR 15048)', '120-125 days', '25-30 q/acre', 'Fine grain, low glycemic index, blast tolerant, suitable for Telangana conditions'],
      ['Bathukamma (JGL 18047)', '125 days', '28-32 q/acre', 'Fine grain, good cooking quality, non-lodging type'],
      ['Samba Mahsuri (BPT 5204)', '145-150 days', '25-30 q/acre', 'Popular fine grain, needs careful disease management'],
      ['MTU 1010', '120-125 days', '25-32 q/acre', 'Short duration, suitable where water is limited'],
      ['JGL 24423', '130-135 days', '28-34 q/acre', 'High yielding fine grain variety for irrigated ecology'],
    ],
    production: [
      ['Soil', 'Use level fields with bunds; avoid fields with severe salinity or alkalinity.', 'సమతలంగా ఉన్న పొలాలు, బలమైన మెట్లు ఉండాలి; అధిక చౌడు లేదా క్షార భూములు నివారించాలి.'],
      ['Land Preparation', 'Puddle thoroughly for transplanted paddy; for direct seeded rice prepare a fine, firm seedbed.', 'నాట్ల వరికి మట్టిని బాగా కలియదున్నాలి; నేరుగా విత్తే పద్ధతికి మెత్తని గట్టి విత్తన మడిని సిద్ధం చేయాలి.'],
      ['Nursery', 'Use clean seed, raised nursery beds and avoid over-aged seedlings.', 'శుభ్రమైన విత్తనం, ఎత్తైన నారు మడులు వాడి, ముదురు నారు వాడకూడదు.'],
      ['Harvest', 'Drain water 7-10 days before harvest and dry grain to safe moisture.', 'కోతకు 7-10 రోజుల ముందు నీరు వదిలి, ధాన్యాన్ని సురక్షిత తేమ వరకు ఆరబెట్టాలి.'],
    ],
    fertilizers: [
      ['Basal', 'DAP + MOP + FYM', 'As per soil test; full P and K basally', 'Incorporate before transplanting'],
      ['Tillering', 'Urea', '1/3 nitrogen', 'Broadcast on moist soil after draining excess water'],
      ['Panicle initiation', 'Urea', '1/3 nitrogen', 'Top dress with shallow water'],
      ['Micronutrient correction', 'Zinc sulphate', '20 kg/ha where deficient', 'Basal or foliar correction as advisory'],
    ],
    irrigation: [
      ['Establishment', 'Maintain shallow water after seedling establishment; avoid deep submergence.'],
      ['Tillering', 'Alternate wetting and drying is suitable where fields are level and water control is possible.'],
      ['Flowering', 'Do not allow moisture stress from panicle initiation to grain filling.'],
    ],
    weeds: [
      ['Echinochloa crus-galli', 'Barnyard grass', 'Early flooding, line planting and hand weeding', 'Pretilachlor 50 EC', '500 ml/acre within 3-5 DAT'],
      ['Cyperus difformis', 'Smallflower umbrella sedge', 'Maintain shallow water and remove before seed set', 'Bensulfuron methyl + Pretilachlor', 'Recommended label dose'],
      ['Monochoria vaginalis', 'Pickerel weed', 'Hand weeding and stale seedbed', '2,4-D sodium salt', 'Use after crop establishment'],
    ],
    pests: [
      ['Brown planthopper', 'Nilaparvata lugens', 'Nymphs and adults suck sap at plant base; hopper burn patches appear.', 'Avoid excess nitrogen, drain briefly, conserve predators and spray above ETL.', 'Pymetrozine 50 WG or Dinotefuran 20 SG as local advisory', img.bph, sources.tnauRiceStemBorer],
      ['Yellow stem borer', 'Scirpophaga incertulas', 'Dead heart at vegetative stage and white ear at reproductive stage.', 'Clip seedling tips, remove stubbles, use pheromone traps and need-based insecticide.', 'Chlorantraniliprole 18.5 SC or Cartap hydrochloride', img.stemBorer, sources.tnauRiceStemBorer],
    ],
    diseases: [
      ['Blast', 'Magnaporthe oryzae / Pyricularia oryzae', 'Spindle-shaped grey lesions with brown margins; neck blast causes chaffy grains.', 'Use clean seed, balanced nitrogen, tolerant varieties and avoid dense canopy.', 'Tricyclazole 75 WP or Azoxystrobin + Difenoconazole', img.blast, sources.tnauRiceBlast],
      ['Sheath blight', 'Rhizoctonia solani', 'Oval lesions on sheath near water line that spread upward.', 'Avoid excess nitrogen, maintain spacing and improve aeration.', 'Hexaconazole or Validamycin as recommended', img.paddy, sources.pjtsau],
    ],
    deficiencies: [
      ['Zinc deficiency', 'Zinc', 'Bronzing, stunted plants and uneven growth patches.', 'Apply zinc sulphate to soil or foliar spray based on severity.', img.zinc],
      ['Nitrogen deficiency', 'Nitrogen', 'Older leaves turn pale yellow and tillering reduces.', 'Apply split nitrogen after confirming no waterlogging stress.', img.paddy],
    ],
  },
  {
    slug: 'maize',
    crop_name: 'Maize',
    name_en: 'Maize',
    name_te: 'మొక్కజొన్న',
    scientific_name: 'Zea mays',
    acreage: 1400000,
    image_url: img.maize,
    source_pdf_name: 'maize.pdf',
    profile: {
      crop_profile: 'Cereal crop grown for grain, fodder, sweet corn and industrial use; hybrids dominate commercial production.',
      crop_profile_te: 'ధాన్యం, పశుగ్రాసం, స్వీట్ కార్న్ మరియు పరిశ్రమల కోసం సాగు చేసే ముఖ్యమైన ధాన్య పంట.',
      soil_requirements: 'Well-drained fertile loams and red sandy loams are ideal. Waterlogging seriously reduces stand and yield.',
      climate_requirements: 'Warm climate with good sunlight. Critical moisture stages are knee high, tasseling, silking and grain filling.',
      sowing_time_spacing_land_preparation: 'Sow with onset of monsoon or under irrigation. Use 60 x 20 cm spacing for grain maize; prepare ridges or well-drained beds.',
      seed_rate_seed_treatment: 'Use 8-10 kg seed/acre for hybrids. Treat seed with recommended fungicide and fall armyworm seed treatment where advised.',
      crop_production_practices: 'Direct line sowing, timely gap filling, earthing up, balanced fertilizer and early scouting for fall armyworm are essential.',
      harvesting_yield: 'Harvest when husk turns dry and grain moisture falls. Expected grain yield is 25-35 q/acre in good hybrids.',
      deficiency_symptoms: 'Nitrogen deficiency causes V-shaped yellowing of older leaves; zinc deficiency causes white bands near leaf base.',
    },
    varieties: [
      ['DHM 111', '90-95 days', '25-30 q/acre', 'Tolerant to leaf blight and stalk rot; suitable for Telangana'],
      ['DHM 117', '95-100 days', '30-35 q/acre', 'Orange flint grain, tolerant to stem borer and blights'],
      ['DHM 121', '90-95 days', '30-35 q/acre', 'Short duration hybrid with good disease tolerance'],
      ['Karimnagar Makka 1', '95-100 days', '30-35 q/acre', 'Tolerant to leaf blight and downy mildew'],
      ['COH(M) 8 / local hybrid', '95-110 days', '30-38 q/acre', 'Use locally notified hybrid suited to season'],
    ],
    production: [
      ['Land Preparation', 'Prepare a fine seedbed with drainage furrows; avoid cloddy fields.', 'మురుగు నీరు పోయేలా సాళ్లు చేసి మెత్తని విత్తన మడిని సిద్ధం చేయాలి.'],
      ['Sowing', 'Place seed 4-5 cm deep in lines and maintain uniform plant stand.', 'విత్తనాన్ని 4-5 సెం.మీ. లోతులో వరుసలలో వేసి సమాన మొక్కల సంఖ్య ఉంచాలి.'],
      ['Earthing Up', 'Earth up at knee-high stage after top dressing nitrogen.', 'మోకాలి ఎత్తు దశలో నత్రజని వేసిన తరువాత మట్టిని ఎగదీయాలి.'],
      ['Harvest', 'Harvest when cobs dry and black layer forms at grain base.', 'కంకులు ఎండినప్పుడు, గింజ అడుగున బ్లాక్ లేయర్ ఏర్పడినప్పుడు కోత చేయాలి.'],
    ],
    fertilizers: [
      ['Basal', 'DAP + MOP + FYM', 'Full P and K; 1/3 N', 'Band placement near seed row'],
      ['Knee-high', 'Urea', '1/3 nitrogen', 'Top dress followed by earthing up'],
      ['Tasseling', 'Urea', '1/3 nitrogen', 'Apply with irrigation or adequate soil moisture'],
      ['Micronutrient', 'Zinc sulphate', 'Soil-test based', 'Basal or foliar correction'],
    ],
    irrigation: [
      ['Knee-high', 'Give irrigation if rainfall gap occurs.'],
      ['Tasseling and Silking', 'Most critical stage; avoid stress.'],
      ['Grain Filling', 'Maintain moisture until physiological maturity.'],
    ],
    weeds: [
      ['Cyperus rotundus', 'Nut sedge', 'Interculture and removal of tubers where possible', 'Atrazine 50 WP', '0.8-1.0 kg/acre pre-emergence'],
      ['Echinochloa colona', 'Jungle rice', 'Early hoeing and row cultivation', 'Tembotrione', 'Use as post-emergence as advised'],
      ['Commelina benghalensis', 'Dayflower', 'Hand removal before rooting at nodes', 'Atrazine followed by hoeing', 'Label dose'],
    ],
    pests: [
      ['Fall armyworm', 'Spodoptera frugiperda', 'Scraping, ragged holes, whorl feeding and frass in central whorl.', 'Install pheromone traps, destroy egg masses, direct spray into whorl at early stage.', 'Chlorantraniliprole 18.5 SC, Emamectin benzoate 5 SG or Spinetoram 11.7 SC', img.fallArmyworm, sources.tnauMaizeFaw],
      ['Stem borer', 'Chilo partellus', 'Dead hearts in young crop and stem tunneling.', 'Remove affected whorls, intercrop cowpea and use need-based whorl application.', 'Chlorantraniliprole or Carbofuran granules as permitted', img.maizeStemBorer, sources.tnauMaize],
    ],
    diseases: [
      ['Turcicum leaf blight', 'Exserohilum turcicum', 'Long grey-green cigar-shaped lesions on leaves.', 'Use tolerant hybrids and remove infected residues.', 'Mancozeb or Propiconazole as advisory', img.maize, sources.pjtsau],
      ['Banded leaf and sheath blight', 'Rhizoctonia solani f. sp. sasakii', 'Banded lesions on sheath and lower leaves.', 'Avoid dense planting and waterlogging.', 'Validamycin or Hexaconazole as recommended', img.maize, sources.pjtsau],
    ],
    deficiencies: [
      ['Zinc deficiency', 'Zinc', 'Broad white bands on young leaves near the base.', 'Apply zinc sulphate or foliar zinc as soil-test based correction.', img.maize],
      ['Nitrogen deficiency', 'Nitrogen', 'V-shaped yellowing from tip down the midrib of older leaves.', 'Top dress nitrogen with adequate moisture.', img.maize],
    ],
  },
  {
    slug: 'cotton',
    crop_name: 'Cotton',
    name_en: 'Cotton',
    name_te: 'పత్తి',
    scientific_name: 'Gossypium hirsutum',
    acreage: 1800000,
    image_url: img.cotton,
    source_pdf_name: 'cotton.pdf',
    profile: {
      crop_profile: 'Long duration fibre crop grown mainly under rainfed and irrigated black soil conditions.',
      crop_profile_te: 'వర్షాధార మరియు సాగునీటి నల్లరేగడి భూముల్లో సాగు చేసే దీర్ఘకాలిక నార పంట.',
      soil_requirements: 'Deep black cotton soils with good moisture retention are best; avoid shallow and waterlogged soils.',
      climate_requirements: 'Warm climate with bright sunshine during boll opening. Excess rain during boll maturity reduces lint quality.',
      sowing_time_spacing_land_preparation: 'Sow with monsoon onset on ridges or broad beds. Spacing varies by Bt hybrid, commonly 90 x 60 cm or wider.',
      seed_rate_seed_treatment: 'Use 1.5-2.0 kg hybrid seed/acre. Treat with fungicide and biofertilizer as advised; maintain refuge for Bt cotton.',
      crop_production_practices: 'Timely sowing, gap filling, early weed control, balanced nutrition and IPM for sucking pests and bollworms are critical.',
      harvesting_yield: 'Pick fully opened clean kapas in multiple pickings. Expected kapas yield is 8-15 q/acre depending on rainfall and hybrid.',
      deficiency_symptoms: 'Magnesium deficiency causes interveinal yellowing of older leaves; boron deficiency causes square and boll shedding.',
    },
    varieties: [
      ['Narasimha (NA 1325)', '160-170 days', '8-12 q/acre kapas', 'Drought tolerant and jassid tolerant desi type'],
      ['Srirama (NDLH 1938)', '160-180 days', '10-14 q/acre kapas', 'Robust rainfed variety with good boll setting'],
      ['Bt hybrid - local notified', '150-180 days', '10-18 q/acre kapas', 'Use only notified hybrids suited to district and season'],
      ['WGCV 48', '160 days', '8-12 q/acre kapas', 'Suitable for rainfed cotton areas'],
      ['Suraj / compact cotton type', '150-160 days', '8-12 q/acre kapas', 'Suitable where high density planting is practiced'],
    ],
    production: [
      ['Land Preparation', 'Deep summer ploughing and broad bed furrow system improve drainage.', 'లోతుగా వేసవి దున్నకం చేసి బ్రాడ్ బెడ్ ఫరో పద్ధతి వాడితే మురుగు నీరు బాగా పోతుంది.'],
      ['Sowing', 'Sow after sufficient rainfall and maintain one healthy plant per hill.', 'తగిన వర్షం తరువాత విత్తి ప్రతి గుంటలో ఒక ఆరోగ్యకరమైన మొక్క ఉంచాలి.'],
      ['Interculture', 'Keep crop weed-free for first 45-60 days and earth up rows.', 'మొదటి 45-60 రోజులు కలుపు లేకుండా ఉంచి వరుసలకు మట్టిని ఎగదీయాలి.'],
      ['Picking', 'Pick kapas during dry weather and keep clean cotton separate.', 'ఎండ వాతావరణంలో పత్తి ఏరి శుభ్రమైన పత్తిని విడిగా ఉంచాలి.'],
    ],
    fertilizers: [
      ['Basal', 'DAP + MOP + FYM', 'Soil-test based; part N and full P/K', 'Place near root zone before sowing'],
      ['30 DAS', 'Urea', 'First top dressing', 'Apply after weeding with moisture'],
      ['60 DAS', 'Urea + MOP', 'Second top dressing', 'Apply before flowering peak'],
      ['Flowering', 'Boron or MgSO4', 'Deficiency based foliar spray', 'Spray during cool hours'],
    ],
    irrigation: [
      ['Squaring', 'Avoid severe stress during square formation.'],
      ['Flowering', 'Critical for boll retention.'],
      ['Boll Development', 'Irrigate if dry spell occurs, but avoid waterlogging.'],
    ],
    weeds: [
      ['Trianthema portulacastrum', 'Horse purslane', 'Early hoeing and hand weeding', 'Pendimethalin 30 EC', '1.0-1.3 L/acre pre-emergence'],
      ['Parthenium hysterophorus', 'Congress grass', 'Remove before flowering and maintain field borders', 'Directed glyphosate on bunds only', 'Avoid crop contact'],
      ['Cyperus rotundus', 'Nut sedge', 'Repeated interculture and tuber exhaustion', 'Pyrithiobac sodium', 'Post-emergence label dose'],
    ],
    pests: [
      ['Pink bollworm', 'Pectinophora gossypiella', 'Rosette flowers, bored bolls, damaged seed and stained lint.', 'Use pheromone traps, remove damaged bolls, terminate crop timely and follow refuge.', 'Emamectin benzoate 5 SG, Chlorantraniliprole 18.5 SC or Diflubenzuron 25 WP', img.pinkBollworm, sources.tnauCottonPink],
      ['Whitefly', 'Bemisia tabaci', 'Yellowing, honeydew, sooty mould and leaf curl spread.', 'Avoid excess nitrogen, conserve natural enemies and use yellow sticky traps.', 'Pyriproxyfen, Diafenthiuron or Spiromesifen as advisory', img.whitefly, sources.pjtsau],
    ],
    diseases: [
      ['Alternaria leaf spot', 'Alternaria macrospora', 'Brown concentric leaf spots and defoliation.', 'Use healthy seed, remove debris and avoid moisture stress.', 'Mancozeb or Copper oxychloride', img.cotton, sources.pjtsau],
      ['Bacterial blight', 'Xanthomonas citri pv. malvacearum', 'Angular leaf spots, black arm symptoms and boll lesions.', 'Use acid-delinted clean seed and tolerant varieties.', 'Streptocycline + Copper oxychloride where recommended', img.cotton, sources.pjtsau],
    ],
    deficiencies: [
      ['Boron deficiency', 'Boron', 'Square shedding, cracked bolls and poor boll opening.', 'Foliar spray borax at recommended concentration.', img.cotton],
      ['Magnesium deficiency', 'Magnesium', 'Interveinal chlorosis of older leaves turning reddish.', 'Spray magnesium sulphate in repeated low-dose sprays.', img.cotton],
    ],
  },
  {
    slug: 'redgram',
    crop_name: 'Redgram',
    name_en: 'Redgram / Pigeonpea',
    name_te: 'కంది',
    scientific_name: 'Cajanus cajan',
    acreage: 650000,
    image_url: img.redgram,
    source_pdf_name: 'redgram.pdf',
    profile: {
      crop_profile: 'Deep-rooted pulse crop grown as sole crop, intercrop and border crop in rainfed systems.',
      crop_profile_te: 'వర్షాధార పద్ధతుల్లో ఒంటరి పంటగా, అంతర పంటగా, సరిహద్దు పంటగా సాగు చేసే లోతైన వేర్ల పప్పుధాన్య పంట.',
      soil_requirements: 'Well-drained red sandy loams and medium black soils are suitable. Waterlogging causes wilt and root rot.',
      climate_requirements: 'Warm semi-arid climate; flowering and pod filling need mild weather and no prolonged moisture stress.',
      sowing_time_spacing_land_preparation: 'Kharif sowing with monsoon onset; spacing 90 x 20 cm for long duration and closer for short duration types.',
      seed_rate_seed_treatment: 'Use 4-6 kg seed/acre. Treat with fungicide, Rhizobium and PSB as recommended.',
      crop_production_practices: 'Timely sowing, seed inoculation, interculture, drainage and pod borer monitoring from flowering are essential.',
      harvesting_yield: 'Harvest when 80% pods turn brown and dry. Expected grain yield is 5-8 q/acre in rainfed crop.',
      deficiency_symptoms: 'Sulphur deficiency causes uniform yellowing of young leaves; iron chlorosis may occur in calcareous soils.',
    },
    varieties: [
      ['PRG 176', '130-140 days', '6-8 q/acre', 'Suitable for rabi and short duration planting'],
      ['LRG 41', '160-180 days', '5-8 q/acre', 'Popular variety suited to rainfed areas'],
      ['Asha (ICPL 87119)', '160-180 days', '6-9 q/acre', 'Wilt tolerant and widely adapted'],
      ['WRGE 97', '150-160 days', '6-8 q/acre', 'Suitable to medium soils'],
      ['TS 3R', '150-165 days', '6-9 q/acre', 'Recommended where local seed is available'],
    ],
    production: [
      ['Land Preparation', 'Open furrows for drainage in black soils and avoid compact seedbeds.', 'నల్లరేగడి భూముల్లో నీరు నిల్వ కాకుండా సాళ్లు ఏర్పాటు చేయాలి.'],
      ['Sowing', 'Use line sowing and maintain proper spacing for branching.', 'కొమ్మలు విస్తరించడానికి సరైన దూరంతో వరుసల్లో విత్తాలి.'],
      ['Interculture', 'Hoe at 25-30 and 45-50 DAS to conserve moisture and control weeds.', '25-30 మరియు 45-50 రోజుల దశలో కలుపు తీసి తేమ నిల్వ చేయాలి.'],
      ['Harvest', 'Cut plants when pods are dry; thresh after sun drying.', 'కాయలు ఎండినప్పుడు మొక్కలను కోసి ఎండబెట్టి నూర్పిడి చేయాలి.'],
    ],
    fertilizers: [
      ['Basal', 'SSP or DAP + FYM', 'Apply starter N and full P', 'Place below seed at sowing'],
      ['Biofertilizer', 'Rhizobium + PSB', 'One packet each per seed lot', 'Seed inoculation in shade'],
      ['Sulphur', 'Gypsum or SSP source', 'Soil-test based', 'Basal incorporation'],
      ['Flowering', 'Pulse wonder or 2% DAP', 'As advisory', 'Foliar spray during cool hours'],
    ],
    irrigation: [
      ['Establishment', 'Protect germination if monsoon break occurs.'],
      ['Flowering', 'One protective irrigation improves pod set in dry spell.'],
      ['Pod Filling', 'Avoid waterlogging; provide light irrigation only if needed.'],
    ],
    weeds: [
      ['Parthenium hysterophorus', 'Congress grass', 'Remove before flowering and maintain borders', 'Pendimethalin 30 EC', '1.0 L/acre pre-emergence'],
      ['Cynodon dactylon', 'Bermuda grass', 'Repeated hoeing and rhizome removal', 'Quizalofop ethyl', 'Post-emergence for grasses'],
      ['Commelina benghalensis', 'Dayflower', 'Hand weeding and interculture', 'Imazethapyr', 'Use where recommended for pulses'],
    ],
    pests: [
      ['Gram pod borer', 'Helicoverpa armigera', 'Larva feeds with head inside pod; round holes and grain damage.', 'Use pheromone traps, bird perches, NPV, sunflower trap row and need-based sprays.', 'Emamectin benzoate 5 SG, Indoxacarb 15.8 SC, Chlorantraniliprole 18.5 SC or Spinosad 45 SC', img.redgramPodBorer, sources.tnauRedgramPodBorer],
      ['Pod fly', 'Melanagromyza obtusa', 'Maggot feeds inside developing seed; shrivelled grain.', 'Early sowing, collect damaged pods and avoid staggered flowering.', 'Dimethoate or Thiomethoxam as local advisory', img.redgram, sources.pjtsau],
    ],
    diseases: [
      ['Wilt', 'Fusarium udum', 'Sudden wilting, brown vascular discoloration and plant death.', 'Use wilt tolerant variety, seed treatment and crop rotation.', 'Carbendazim seed treatment; Trichoderma in soil', img.redgram, sources.pjtsau],
      ['Sterility mosaic', 'Pigeonpea sterility mosaic virus', 'Bushy pale green plants with little or no flowering.', 'Use resistant varieties and control eriophyid mite vector.', 'Wettable sulphur or Dimethoate as advisory for mite', img.redgram, sources.pjtsau],
    ],
    deficiencies: [
      ['Sulphur deficiency', 'Sulphur', 'Young leaves become pale and plants remain weak.', 'Apply gypsum or SSP based on soil test.', img.redgram],
      ['Iron chlorosis', 'Iron', 'Young leaves show interveinal chlorosis in calcareous soils.', 'Foliar spray ferrous sulphate with lime neutralization.', img.redgram],
    ],
  },
  {
    slug: 'greengram',
    crop_name: 'Greengram',
    name_en: 'Greengram / Mungbean',
    name_te: 'పెసర',
    scientific_name: 'Vigna radiata',
    acreage: 300000,
    image_url: img.greengram,
    source_pdf_name: 'greengram.pdf',
    profile: {
      crop_profile: 'Short duration pulse crop suitable for kharif, rabi and summer windows and as a catch crop.',
      crop_profile_te: 'ఖరీఫ్, రబీ, వేసవి కాలాలకు మరియు క్యాచ్ క్రాప్‌గా అనువైన స్వల్పకాలిక పప్పుధాన్య పంట.',
      soil_requirements: 'Well-drained loamy soils with neutral pH are preferred. Avoid saline and waterlogged fields.',
      climate_requirements: 'Warm weather crop. Cloudy humid weather increases yellow mosaic and powdery mildew risk.',
      sowing_time_spacing_land_preparation: 'Line sow at 30 x 10 cm in a fine seedbed. Kharif sowing with rains; summer sowing under irrigation.',
      seed_rate_seed_treatment: 'Use 6-8 kg seed/acre. Treat with fungicide, Rhizobium and PSB; use certified seed for yellow mosaic tolerance.',
      crop_production_practices: 'Direct line sowing, early weed-free period, drainage, whitefly monitoring and timely harvest reduce losses.',
      harvesting_yield: 'Harvest mature pods in 1-2 pickings or whole plant when most pods turn black. Expected yield is 4-6 q/acre.',
      deficiency_symptoms: 'Molybdenum deficiency reduces nodulation; sulphur deficiency causes pale young leaves and poor seed protein.',
    },
    varieties: [
      ['WGG 37 (Ekasila)', '60-65 days', '4-6 q/acre', 'Shiny green seed and tolerance to yellow mosaic'],
      ['MGG 295', '60-65 days', '4-6 q/acre', 'Suitable for kharif and rabi seasons'],
      ['VBN (Gg) 5', '70-75 days', '5-7 q/acre', 'High yielding, resistant to MYMV and leaf crinkle virus'],
      ['LGG 460', '65-70 days', '4-6 q/acre', 'Bold seed and good market preference'],
      ['IPM 2-14', '65-70 days', '4-6 q/acre', 'Yellow mosaic tolerant in many regions'],
    ],
    production: [
      ['Land Preparation', 'Prepare a fine seedbed and ensure drainage channels.', 'మెత్తని విత్తన మడిని సిద్ధం చేసి మురుగు నీటి కాలువలు ఏర్పాటు చేయాలి.'],
      ['Sowing', 'Use line sowing for easy interculture and plant protection.', 'మధ్య జోత మరియు రక్షణ చర్యలకు సులభంగా ఉండేలా వరుసల్లో విత్తాలి.'],
      ['Weeding', 'Keep crop weed-free up to 25-30 days.', '25-30 రోజుల వరకు కలుపు లేకుండా ఉంచాలి.'],
      ['Harvest', 'Pick pods when mature to avoid shattering and weather damage.', 'కాయలు పక్వానికి వచ్చినప్పుడు ఏరి రాలిపోవడం, వర్ష నష్టం నివారించాలి.'],
    ],
    fertilizers: [
      ['Basal', 'DAP or SSP + MOP', 'Starter N and full P/K', 'Drill below seed line'],
      ['Biofertilizer', 'Rhizobium + PSB', 'Seed treatment', 'Inoculate in shade before sowing'],
      ['Sulphur', 'Gypsum or bentonite sulphur', 'Soil-test based', 'Basal application'],
      ['Flowering', '2% DAP or pulse special', 'As advisory', 'Foliar spray for stress recovery'],
    ],
    irrigation: [
      ['Germination', 'Light irrigation for summer sowing.'],
      ['Flowering', 'Avoid stress; waterlogging must be avoided.'],
      ['Pod Filling', 'One light irrigation may be useful in summer crop.'],
    ],
    weeds: [
      ['Cyperus rotundus', 'Nut sedge', 'Early hand weeding and hoeing', 'Pendimethalin 30 EC', '0.75-1.0 L/acre pre-emergence'],
      ['Echinochloa colona', 'Jungle rice', 'Line sowing and interculture', 'Quizalofop ethyl', 'Post-emergence grass control'],
      ['Trianthema portulacastrum', 'Horse purslane', 'Remove before it spreads as mat', 'Imazethapyr', 'Use as locally recommended'],
    ],
    pests: [
      ['Whitefly', 'Bemisia tabaci', 'Sucks sap and transmits yellow mosaic virus.', 'Use yellow sticky traps, remove infected plants and avoid late sowing.', 'Thiamethoxam or Acetamiprid as advisory', img.greengramYellowMosaic, sources.tnauGreengramYellowMosaic],
      ['Spotted pod borer', 'Maruca vitrata', 'Webbed flowers and pods with larval feeding.', 'Monitor from flowering, remove webs and use need-based sprays.', 'Emamectin benzoate or Chlorantraniliprole', img.greengram, sources.pjtsau],
    ],
    diseases: [
      ['Yellow mosaic', 'Mungbean yellow mosaic virus', 'Yellow and green mosaic patches, stunting and few pods.', 'Use tolerant varieties, early sowing and manage whitefly vector.', 'No curative fungicide; vector control only', img.greengramYellowMosaic, sources.tnauGreengramYellowMosaic],
      ['Powdery mildew', 'Erysiphe polygoni', 'White powdery growth on leaves and pods.', 'Avoid late humid crop and use tolerant varieties.', 'Wettable sulphur or Hexaconazole as advisory', img.greengram, sources.pjtsau],
    ],
    deficiencies: [
      ['Sulphur deficiency', 'Sulphur', 'Pale young leaves and poor growth.', 'Apply sulphur source basally.', img.greengram],
      ['Molybdenum deficiency', 'Molybdenum', 'Poor nodulation and nitrogen fixation.', 'Use micronutrient seed coating where advised.', img.greengram],
    ],
  },
];

const te = {
  soil: 'నేల',
  climate: 'వాతావరణం',
  varieties: 'రకాలు',
  sowing: 'విత్తడం',
  fertilizer: 'ఎరువులు',
  irrigation: 'నీటి నిర్వహణ',
  weeds: 'కలుపు',
  pests: 'పురుగులు',
  diseases: 'తెగుళ్లు',
  harvest: 'కోత',
  advisory: 'సలహా',
};

function fertilizerAdvisories(crop) {
  return [
    ['Pre-sowing', 'Collect soil sample and plan fertilizer from soil-test values.', 'విత్తే ముందు నేల నమూనా తీసుకుని పరీక్ష ఆధారంగా ఎరువుల ప్రణాళిక చేయాలి.'],
    ['Seed treatment', crop.profile.seed_rate_seed_treatment, `విత్తన శుద్ధి తప్పనిసరిగా చేసి ${crop.name_te} పంటను ఆరోగ్యంగా ప్రారంభించాలి.`],
    ['Weather risk', 'Do not spray pesticides during high wind, rain or peak heat.', 'గాలి ఎక్కువగా ఉన్నప్పుడు, వర్షం ఉన్నప్పుడు లేదా తీవ్రమైన ఎండలో మందులు పిచికారీ చేయకూడదు.'],
    ['IPM', 'Use cultural, mechanical and biological measures before chemical control.', 'రసాయన నియంత్రణకు ముందు సాగు, యాంత్రిక, జీవ నియంత్రణ పద్ధతులు పాటించాలి.'],
  ];
}

function makeFaqs(crop) {
  const base = [
    ['Crop Profile', `What is the best production system for ${crop.name_en}?`, `${crop.profile.crop_production_practices}`, ['profile', 'production']],
    ['Soil', `Which soil is suitable for ${crop.name_en}?`, crop.profile.soil_requirements, ['soil', 'land']],
    ['Climate', `What climate does ${crop.name_en} need?`, crop.profile.climate_requirements, ['climate', 'weather']],
    ['Seed', `What is the seed rate for ${crop.name_en}?`, crop.profile.seed_rate_seed_treatment, ['seed rate', 'seed treatment']],
    ['Sowing', `When and how should ${crop.name_en} be sown?`, crop.profile.sowing_time_spacing_land_preparation, ['sowing', 'spacing']],
    ['Fertilizer', `How should fertilizer be applied in ${crop.name_en}?`, crop.fertilizers.map((f) => `${f[0]}: ${f[1]} ${f[2]}`).join('; '), ['fertilizer', 'nutrients']],
    ['Irrigation', `What are critical irrigation stages for ${crop.name_en}?`, crop.irrigation.map((i) => `${i[0]}: ${i[1]}`).join(' '), ['irrigation', 'water']],
    ['Weed', `How are weeds managed in ${crop.name_en}?`, crop.weeds.map((w) => `${w[1]}: ${w[2]}`).join('; '), ['weed', 'herbicide']],
    ['Pest', `Which major pests attack ${crop.name_en}?`, crop.pests.map((p) => `${p[0]}: ${p[2]} Management: ${p[3]}`).join(' '), ['pest', 'ipm']],
    ['Disease', `Which diseases are important in ${crop.name_en}?`, crop.diseases.map((d) => `${d[0]}: ${d[2]} Management: ${d[3]}`).join(' '), ['disease', 'fungicide']],
    ['Deficiency', `What nutrient deficiencies are common in ${crop.name_en}?`, crop.deficiencies.map((d) => `${d[0]}: ${d[2]} Correction: ${d[3]}`).join(' '), ['deficiency', 'nutrient']],
    ['Harvest', `When should ${crop.name_en} be harvested?`, crop.profile.harvesting_yield, ['harvest', 'yield']],
  ];
  const stageQuestions = [
    'What should I check this week?',
    'What should an Agriculture Officer advise?',
    'What is the farmer-friendly recommendation?',
    'What field symptom needs attention?',
    'What action should be avoided?',
    'What is the Telugu advisory summary?',
    'What is the chatbot answer?',
    'What is the extension note?',
  ];
  const faqs = [];
  let i = 0;
  while (faqs.length < 100) {
    const item = base[i % base.length];
    const variant = stageQuestions[Math.floor(i / base.length) % stageQuestions.length];
    faqs.push({
      question: `${variant} ${item[1]}`,
      answer: item[2],
      answer_te: `${crop.name_te}: ${translateCategory(item[0])} విభాగంలో ఈ సిఫారసును పాటించాలి. ${crop.profile.crop_profile_te}`,
      crop: crop.slug,
      category: item[0],
      keywords: [...item[3], crop.slug, crop.name_en.toLowerCase()],
    });
    i += 1;
  }
  return faqs;
}

function translateCategory(category) {
  const map = {
    Crop: 'పంట',
    'Crop Profile': 'పంట వివరాలు',
    Soil: te.soil,
    Climate: te.climate,
    Seed: 'విత్తనం',
    Sowing: te.sowing,
    Fertilizer: te.fertilizer,
    Irrigation: te.irrigation,
    Weed: te.weeds,
    Pest: te.pests,
    Disease: te.diseases,
    Deficiency: 'లోప లక్షణాలు',
    Harvest: te.harvest,
  };
  return map[category] || category;
}

function cropJson(crop) {
  return {
    slug: crop.slug,
    crop_profile: {
      name_en: crop.name_en,
      name_te: crop.name_te,
      scientific_name: crop.scientific_name,
      description_en: crop.profile.crop_profile,
      description_te: crop.profile.crop_profile_te,
      source_pdf_name: crop.source_pdf_name,
      image: crop.image_url,
    },
    soil_requirements: { description_en: crop.profile.soil_requirements, description_te: `ఈ పంటకు ${crop.profile.soil_requirements}` },
    climate_requirements: { description_en: crop.profile.climate_requirements, description_te: `వాతావరణ సూచన: ${crop.profile.crop_profile_te}` },
    recommended_varieties: crop.varieties.map((v, idx) => ({
      id: `${crop.slug}-variety-${idx + 1}`,
      crop: crop.slug,
      variety: v[0],
      duration: v[1],
      yield: v[2],
      special_features: v[3],
      image: crop.image_url,
    })),
    crop_production_practices: crop.production.map((p) => ({ stage: p[0], description_en: p[1], description_te: p[2] })),
    seed_rate_seed_treatment: crop.profile.seed_rate_seed_treatment,
    sowing_time_spacing_land_preparation: crop.profile.sowing_time_spacing_land_preparation,
    fertilizer_recommendations: crop.fertilizers.map((f, idx) => ({
      id: `${crop.slug}-fertilizer-${idx + 1}`,
      crop: crop.slug,
      stage: f[0],
      fertilizer: f[1],
      quantity: f[2],
      method: f[3],
    })),
    nutrient_management: crop.profile.deficiency_symptoms,
    irrigation_management: crop.irrigation.map((i) => ({ stage: i[0], recommendation: i[1] })),
    weed_management: crop.weeds.map((w, idx) => ({
      id: `${crop.slug}-weed-${idx + 1}`,
      crop: crop.slug,
      weed_name: w[1],
      scientific_name: w[0],
      control_measure: w[2],
      herbicide: w[3],
      dose: w[4],
      image: crop.image_url,
    })),
    pest_management: crop.pests.map((p, idx) => ({
      id: `${crop.slug}-pest-${idx + 1}`,
      crop: crop.slug,
      pest_name: p[0],
      scientific_name: p[1],
      symptoms: p[2],
      management: p[3],
      chemical_control: p[4],
      image: p[5],
      image_source_url: p[6],
    })),
    disease_management: crop.diseases.map((d, idx) => ({
      id: `${crop.slug}-disease-${idx + 1}`,
      crop: crop.slug,
      disease_name: d[0],
      causal_organism: d[1],
      symptoms: d[2],
      management: d[3],
      fungicide: d[4],
      image: d[5],
      image_source_url: d[6],
    })),
    deficiency_symptoms: crop.deficiencies.map((d) => ({ deficiency: d[0], nutrient: d[1], symptoms: d[2], correction: d[3], image: d[4] })),
    harvesting: crop.profile.harvesting_yield,
    yield_information: crop.varieties.map((v) => ({ variety: v[0], expected_yield: v[2] })),
    advisories: fertilizerAdvisories(crop).map((a) => ({ category: a[0], description_en: a[1], description_te: a[2] })),
    faqs: makeFaqs(crop),
  };
}

function q(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function arr(values) {
  return `ARRAY[${values.map(q).join(', ')}]::text[]`;
}

function createSql() {
  const tableNames = [
    'crop_varieties',
    'crop_production',
    'crop_fertilizers',
    'crop_irrigation',
    'crop_weeds',
    'crop_pests',
    'crop_diseases',
    'crop_deficiencies',
    'crop_advisories',
    'crop_faqs',
    'crop_images',
  ];
  const parts = [];
  parts.push(`-- Agriculture Intelligence Database for Tiryani Agriculture Portal\n-- Generated from supplied PJTAU crop PDFs plus public agricultural image/source references.\n\nCREATE EXTENSION IF NOT EXISTS pgcrypto;\n\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS slug text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS name_en text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS name_te text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS scientific_name text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS source_pdf_name text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS source_pdf_url text;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb;\nALTER TABLE public.crops ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();\nCREATE UNIQUE INDEX IF NOT EXISTS crops_slug_idx ON public.crops(slug);\n\nCREATE TABLE IF NOT EXISTS public.crop_varieties (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  variety text NOT NULL,\n  duration text DEFAULT '',\n  expected_yield text DEFAULT '',\n  special_features text DEFAULT '',\n  image_url text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_production (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  category text NOT NULL,\n  description_en text NOT NULL,\n  description_te text DEFAULT '',\n  season text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_fertilizers (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  stage text NOT NULL,\n  fertilizer text NOT NULL,\n  quantity text DEFAULT '',\n  method text DEFAULT '',\n  description_te text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_irrigation (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  stage text NOT NULL,\n  recommendation_en text NOT NULL,\n  recommendation_te text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_weeds (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  weed_name text NOT NULL,\n  scientific_name text DEFAULT '',\n  control_measure text DEFAULT '',\n  herbicide text DEFAULT '',\n  dose text DEFAULT '',\n  image_url text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_pests (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  pest_name text NOT NULL,\n  scientific_name text DEFAULT '',\n  symptoms text DEFAULT '',\n  management text DEFAULT '',\n  chemical_control text DEFAULT '',\n  image_url text DEFAULT '',\n  image_source_url text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_diseases (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  disease_name text NOT NULL,\n  causal_organism text DEFAULT '',\n  symptoms text DEFAULT '',\n  management text DEFAULT '',\n  fungicide text DEFAULT '',\n  image_url text DEFAULT '',\n  image_source_url text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_deficiencies (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  deficiency_name text NOT NULL,\n  nutrient text DEFAULT '',\n  symptoms text DEFAULT '',\n  correction text DEFAULT '',\n  image_url text DEFAULT '',\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_advisories (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  category text NOT NULL,\n  advisory_en text NOT NULL,\n  advisory_te text DEFAULT '',\n  priority text DEFAULT 'normal',\n  keywords text[] DEFAULT ARRAY[]::text[],\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_faqs (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,\n  question text NOT NULL,\n  answer text NOT NULL,\n  answer_te text DEFAULT '',\n  category text DEFAULT '',\n  keywords text[] DEFAULT ARRAY[]::text[],\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n\nCREATE TABLE IF NOT EXISTS public.crop_images (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  crop_id uuid REFERENCES public.crops(id) ON DELETE CASCADE,\n  entity_type text NOT NULL,\n  entity_name text NOT NULL,\n  image_url text NOT NULL,\n  source_name text DEFAULT '',\n  source_url text DEFAULT '',\n  alt_text text DEFAULT '',\n  created_at timestamptz DEFAULT now()\n);\n\n`);
  parts.push(tableNames.map((name) => `CREATE INDEX IF NOT EXISTS ${name}_crop_id_idx ON public.${name}(crop_id);`).join('\n'));
  parts.push('\nCREATE INDEX IF NOT EXISTS crop_faqs_search_idx ON public.crop_faqs USING gin (to_tsvector(\'english\', question || \' \' || answer || \' \' || coalesce(category, \'\')));\n');
  for (const name of tableNames) {
    parts.push(`ALTER TABLE public.${name} ENABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "Authenticated users can view ${name}" ON public.${name};\nCREATE POLICY "Authenticated users can view ${name}" ON public.${name} FOR SELECT TO authenticated USING (true);\nDROP POLICY IF EXISTS "Admin can manage ${name}" ON public.${name};\nCREATE POLICY "Admin can manage ${name}" ON public.${name} FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'k.vinayreddy166@gmail.com')) WITH CHECK (EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'k.vinayreddy166@gmail.com'));\n`);
  }
  const selectedCropIds = `SELECT id FROM public.crops WHERE slug IN (${crops.map((c) => q(c.slug)).join(', ')})`;
  parts.push(`\n${tableNames.map((t) => `DELETE FROM public.${t} WHERE crop_id IN (${selectedCropIds});`).join('\n')}\n`);
  for (const crop of crops) {
    parts.push(`\nINSERT INTO public.crops (crop_name, acreage, description, image_url, slug, name_en, name_te, scientific_name, source_pdf_name, profile, updated_at)\nVALUES (${q(crop.crop_name)}, ${crop.acreage}, ${q(crop.profile.crop_profile)}, ${q(crop.image_url)}, ${q(crop.slug)}, ${q(crop.name_en)}, ${q(crop.name_te)}, ${q(crop.scientific_name)}, ${q(crop.source_pdf_name)}, ${q(JSON.stringify(crop.profile))}::jsonb, now())\nON CONFLICT (crop_name) DO UPDATE SET acreage = EXCLUDED.acreage, description = EXCLUDED.description, image_url = EXCLUDED.image_url, slug = EXCLUDED.slug, name_en = EXCLUDED.name_en, name_te = EXCLUDED.name_te, scientific_name = EXCLUDED.scientific_name, source_pdf_name = EXCLUDED.source_pdf_name, profile = EXCLUDED.profile, updated_at = now();\n`);
    const cid = `(SELECT id FROM public.crops WHERE crop_name = ${q(crop.crop_name)})`;
    parts.push(`INSERT INTO public.crop_varieties (crop_id, variety, duration, expected_yield, special_features, image_url) VALUES\n${crop.varieties.map((v) => `(${cid}, ${q(v[0])}, ${q(v[1])}, ${q(v[2])}, ${q(v[3])}, ${q(crop.image_url)})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_production (crop_id, category, description_en, description_te) VALUES\n${crop.production.map((p) => `(${cid}, ${q(p[0])}, ${q(p[1])}, ${q(p[2])})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_fertilizers (crop_id, stage, fertilizer, quantity, method, description_te) VALUES\n${crop.fertilizers.map((f) => `(${cid}, ${q(f[0])}, ${q(f[1])}, ${q(f[2])}, ${q(f[3])}, ${q(`${crop.name_te}లో ${f[0]} దశలో ${f[1]}ను సిఫారసు ప్రకారం వాడాలి.`)})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_irrigation (crop_id, stage, recommendation_en, recommendation_te) VALUES\n${crop.irrigation.map((i) => `(${cid}, ${q(i[0])}, ${q(i[1])}, ${q(`${crop.name_te} పంటలో ${i[0]} దశలో తేమ ఒత్తిడి రాకుండా చూడాలి.`)})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_weeds (crop_id, scientific_name, weed_name, control_measure, herbicide, dose, image_url) VALUES\n${crop.weeds.map((w) => `(${cid}, ${q(w[0])}, ${q(w[1])}, ${q(w[2])}, ${q(w[3])}, ${q(w[4])}, ${q(crop.image_url)})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_pests (crop_id, pest_name, scientific_name, symptoms, management, chemical_control, image_url, image_source_url) VALUES\n${crop.pests.map((p) => `(${cid}, ${q(p[0])}, ${q(p[1])}, ${q(p[2])}, ${q(p[3])}, ${q(p[4])}, ${q(p[5])}, ${q(p[6])})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_diseases (crop_id, disease_name, causal_organism, symptoms, management, fungicide, image_url, image_source_url) VALUES\n${crop.diseases.map((d) => `(${cid}, ${q(d[0])}, ${q(d[1])}, ${q(d[2])}, ${q(d[3])}, ${q(d[4])}, ${q(d[5])}, ${q(d[6])})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_deficiencies (crop_id, deficiency_name, nutrient, symptoms, correction, image_url) VALUES\n${crop.deficiencies.map((d) => `(${cid}, ${q(d[0])}, ${q(d[1])}, ${q(d[2])}, ${q(d[3])}, ${q(d[4])})`).join(',\n')};\n`);
    parts.push(`INSERT INTO public.crop_advisories (crop_id, category, advisory_en, advisory_te, keywords) VALUES\n${fertilizerAdvisories(crop).map((a) => `(${cid}, ${q(a[0])}, ${q(a[1])}, ${q(a[2])}, ${arr([crop.slug, a[0].toLowerCase(), 'advisory'])})`).join(',\n')};\n`);
    const faqs = makeFaqs(crop);
    parts.push(`INSERT INTO public.crop_faqs (crop_id, question, answer, answer_te, category, keywords) VALUES\n${faqs.map((f) => `(${cid}, ${q(f.question)}, ${q(f.answer)}, ${q(f.answer_te)}, ${q(f.category)}, ${arr(f.keywords)})`).join(',\n')};\n`);
    const imageRows = [
      ['crop', crop.name_en, crop.image_url, 'Project public asset', crop.image_url],
      ...crop.pests.map((p) => ['pest', p[0], p[5], 'TNAU/PJTAU reference', p[6]]),
      ...crop.diseases.map((d) => ['disease', d[0], d[5], 'TNAU/PJTAU reference', d[6]]),
      ...crop.deficiencies.map((d) => ['deficiency', d[0], d[4], 'Nutrient reference', d[4]]),
    ];
    parts.push(`INSERT INTO public.crop_images (crop_id, entity_type, entity_name, image_url, source_name, source_url, alt_text) VALUES\n${imageRows.map((r) => `(${cid}, ${q(r[0])}, ${q(r[1])}, ${q(r[2])}, ${q(r[3])}, ${q(r[4])}, ${q(`${r[1]} image for ${crop.name_en}`)})`).join(',\n')};\n`);
  }
  parts.push(`\n-- Backward-compatible consolidated table retained for existing CropPage reads.\nCREATE TABLE IF NOT EXISTS public.crop_intelligence (\n  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n  slug text NOT NULL UNIQUE,\n  name_en text NOT NULL,\n  name_te text NOT NULL,\n  scientific_name text DEFAULT '',\n  crop_image_url text DEFAULT '',\n  source_pdf_name text DEFAULT '',\n  source_pdf_url text DEFAULT '',\n  content jsonb NOT NULL DEFAULT '{}'::jsonb,\n  risks jsonb NOT NULL DEFAULT '[]'::jsonb,\n  created_at timestamptz DEFAULT now(),\n  updated_at timestamptz DEFAULT now()\n);\n`);
  for (const crop of crops) {
    const content = {
      soil: { en: crop.profile.soil_requirements, te: `ఈ పంటకు ${crop.profile.soil_requirements}` },
      duration: { en: crop.varieties[0][1], te: `${crop.name_te} పంట కాలం రకాన్ని బట్టి మారుతుంది.` },
      varieties: crop.varieties.map((v) => ({ name: v[0], duration: v[1], notes: { en: `${v[2]}. ${v[3]}`, te: `${crop.name_te}కు అనుకూలమైన సిఫారసు రకం.` } })),
      practices: crop.production.map((p) => ({ key: p[0].toLowerCase().replaceAll(' ', '_'), title: { en: p[0], te: translateCategory(p[0]) }, body: { en: p[1], te: p[2] } })),
    };
    const risks = [
      ...crop.pests.map((p) => ({ type: 'Pest', name: { en: p[0], te: p[0] }, symptoms: { en: p[2], te: p[2] }, control: { en: p[3], te: `${crop.name_te}లో ఈ పురుగు కనిపిస్తే సమగ్ర నియంత్రణ పాటించాలి.` }, chemicals: p[4].split(', '), newChemicals: [], image_url: p[5], image_source_url: p[6] })),
      ...crop.diseases.map((d) => ({ type: 'Disease', name: { en: d[0], te: d[0] }, symptoms: { en: d[2], te: d[2] }, control: { en: d[3], te: `${crop.name_te}లో ఈ తెగులు కోసం శుభ్రమైన విత్తనం మరియు సిఫారసు మందు వాడాలి.` }, chemicals: d[4].split(', '), newChemicals: [], image_url: d[5], image_source_url: d[6] })),
    ];
    parts.push(`INSERT INTO public.crop_intelligence (slug, name_en, name_te, scientific_name, crop_image_url, source_pdf_name, content, risks, updated_at)\nVALUES (${q(crop.slug)}, ${q(crop.name_en)}, ${q(crop.name_te)}, ${q(crop.scientific_name)}, ${q(crop.image_url)}, ${q(crop.source_pdf_name)}, ${q(JSON.stringify(content))}::jsonb, ${q(JSON.stringify(risks))}::jsonb, now())\nON CONFLICT (slug) DO UPDATE SET name_en = EXCLUDED.name_en, name_te = EXCLUDED.name_te, scientific_name = EXCLUDED.scientific_name, crop_image_url = EXCLUDED.crop_image_url, source_pdf_name = EXCLUDED.source_pdf_name, content = EXCLUDED.content, risks = EXCLUDED.risks, updated_at = now();\n`);
  }
  return parts.join('\n');
}

const data = crops.map(cropJson);
for (const crop of crops) {
  fs.writeFileSync(path.join(root, 'json', `${crop.slug}.json`), JSON.stringify(cropJson(crop), null, 2), 'utf8');
}
fs.writeFileSync(path.join(root, 'database', 'crop-intelligence.json'), JSON.stringify(data, null, 2), 'utf8');
fs.writeFileSync(path.join(root, 'public/data', 'crop-intelligence.json'), JSON.stringify(data, null, 2), 'utf8');
fs.writeFileSync(path.join(root, 'images', 'crop-image-references.json'), JSON.stringify(crops.map((crop) => ({
  crop: crop.slug,
  crop_image: crop.image_url,
  pests: crop.pests.map((p) => ({ name: p[0], image: p[5], source: p[6] })),
  diseases: crop.diseases.map((d) => ({ name: d[0], image: d[5], source: d[6] })),
  deficiencies: crop.deficiencies.map((d) => ({ name: d[0], image: d[4] })),
})), null, 2), 'utf8');

const sql = createSql();
fs.writeFileSync(path.join(root, 'database/sql', 'crop_intelligence_database.sql'), sql, 'utf8');
fs.writeFileSync(path.join(root, 'sql', 'crop_intelligence_database.sql'), sql, 'utf8');
fs.writeFileSync(path.join(root, 'supabase/migrations/20260601143000_normalized_crop_intelligence.sql'), sql, 'utf8');

console.log(`Generated ${crops.length} crop JSON files, ${data.reduce((sum, c) => sum + c.faqs.length, 0)} FAQs, and Supabase SQL.`);
