import json
import re
from authoritative_insecticide_map import INSECTICIDE_MAP

# Load current data
with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

meta = data['metadata']
rows = data['rows']

# 1. Update metadata
for k, v in meta.items():
    if k in INSECTICIDE_MAP:
        v['insecticide'] = INSECTICIDE_MAP[k][0]
        v['insecticideTe'] = INSECTICIDE_MAP[k][1]
    
    # Toxicity label standard Telugu
    band = v.get('toxicityBand', '').lower()
    if band == 'green':
        v['toxicityLabel'] = 'Slightly Toxic (Green)'
        v['toxicityLabelTe'] = 'స్వల్ప విషం (ఆకుపచ్చ)'
    elif band == 'blue':
        v['toxicityLabel'] = 'Moderately Toxic (Blue)'
        v['toxicityLabelTe'] = 'మధ్యస్థ విషం (నీలం)'
    elif band == 'yellow':
        v['toxicityLabel'] = 'Highly Toxic (Yellow)'
        v['toxicityLabelTe'] = 'అత్యధిక విషం (పసుపు)'
    elif band == 'red':
        v['toxicityLabel'] = 'Extremely Toxic (Red)'
        v['toxicityLabelTe'] = 'అత్యంత విషం (ఎరుపు)'

# 2. Comprehensive Pest Translations and corrections
PEST_CORRECTIONS = {
    '-Soil drench': ('Aphids (Soil drench)', 'పేనుబంక (నేల తడుపు)'),
    '-foliar application': ('Aphids (Foliar application)', 'పేనుబంక (పిచికారీ)'),
    'Apple borer': ('Apple borer', 'యాపిల్ కాండం తొలుచు పురుగు'),
    'Black bug': ('Black bug', 'నల్ల నల్లి / బ్లాక్ బగ్'),
    'Boll Worms': ('Bollworms', 'కాయ తొలిచే పురుగులు'),
    'Boll worm': ('Bollworm', 'కాయ తొలిచే పురుగు'),
    'Boll worms': ('Bollworms', 'కాయ తొలిచే పురుగులు'),
    'Bollworm,': ('Bollworm', 'కాయ తొలిచే పురుగు'),
    'Bollworms,': ('Bollworms', 'కాయ తొలిచే పురుగులు'),
    'Cabbage Borer': ('Cabbage borer', 'క్యాబేజీ తొలిచే పురుగు'),
    'Cabbage borer': ('Cabbage borer', 'క్యాబేజీ తొలిచే పురుగు'),
    'Cabbage looper': ('Cabbage looper', 'క్యాబేజీ లూపర్ (ఆకు తినే పురుగు)'),
    'Citrus butterfly': ('Citrus butterfly', 'నిమ్మ సీతాకోకచిలుక పురుగు'),
    'Cock chafer grub': ('Cockchafer grub', 'వేరు పురుగు (కాక్‌చేఫర్ గ్రబ్)'),
    'Defoliator (Hyblaea pured), Skeletonizer (Eutectona machaeralis)': ('Defoliator & Skeletonizer (Teak)', 'టేకు ఆకు తినే పురుగు, అస్థిపంజర పురుగు'),
    'Diamond moth back': ('Diamond Back Moth (DBM)', 'డైమండ్ బ్యాక్ మాత్ (DBM)'),
    'Earhead bug,': ('Earhead bug', 'కంకి నల్లి / ఇయర్‌హెడ్ బగ్'),
    'Early shoot & stalk borer': ('Early shoot & stalk borer', 'మొవ్వు మరియు కాండపు తొలిచే పురుగు'),
    'Flea bettle': ('Flea beetle', 'పిట్ట పురుగు / ఫ్లీ బీటిల్'),
    'Fruit & Shoot Borer': ('Shoot & Fruit Borer', 'మొవ్వు మరియు కాయ తొలిచే పురుగు'),
    'Fruit & shoot borer': ('Shoot & Fruit Borer', 'మొవ్వు మరియు కాయ తొలిచే పురుగు'),
    'Fruit and Shoot borer': ('Shoot & Fruit Borer', 'మొవ్వు మరియు కాయ తొలిచే పురుగు'),
    'Furit borer': ('Fruit borer', 'కాయ తొలిచే పురుగు'),
    'Green bug': ('Green bug', 'పచ్చ నల్లి / గ్రీన్ బగ్'),
    'Head borer': ('Head borer', 'కంకి తొలిచే పురుగు'),
    'Helicoverpa armigera': ('Helicoverpa armigera', 'శనగపచ్చ పురుగు (హెలికోవెర్ప)'),
    'Heliothis': ('Heliothis', 'శనగపచ్చ పురుగు (హెలియోథిస్)'),
    'Leaf Webber': ('Leaf webber', 'ఆకు గూడు పురుగు'),
    'Leaf minor': ('Leaf miner', 'ఆకు తొలిచే పురుగు (చిత్రపురుగు)'),
    'Leaf minor, Aphid, Sawfly': ('Leaf miner, Aphids, Sawfly', 'ఆకు తొలిచే పురుగు, పేనుబంక, రంపపు ఈగ'),
    'Lopper': ('Looper', 'లూపర్ పురుగు / సెమీలూపర్'),
    'Milky weed bug': ('Milky weed bug', 'పాల నల్లి'),
    'Mosquito': ('Mosquito (Public Health)', 'దోమలు (ప్రజారోగ్యం)'),
    'Mustard sawfly & painted bug': ('Mustard sawfly & Painted bug', 'ఆవ రంపపు ఈగ & చిత్ర నల్లి'),
    'Painted bug': ('Painted bug', 'చిత్ర నల్లి (పెయింటెడ్ బగ్)'),
    'Pink boll worm, Spotted boll worm , American boll worm': ('Pink, Spotted & American bollworms', 'గులాబీ రంగు, మచ్చల మరియు శనగపచ్చ కాయ తొలిచే పురుగులు'),
    'Pink boll worm, Spotted boll worm , American boll worm, whitefly': ('Pink, Spotted, American bollworms & Whitefly', 'గులాబీ రంగు, మచ్చల, శనగపచ్చ కాయ తొలిచే పురుగులు & తెల్లదోమ'),
    'Plume moth, Pod fly': ('Plume moth, Pod fly', 'ప్లూమ్ మాత్ & కాయ ఈగ'),
    'Plume mouth, Pod fly': ('Plume moth, Pod fly', 'ప్లూమ్ మాత్ & కాయ ఈగ'),
    'Psylla': ('Psylla', 'సైల్లా / సైలిడ్స్'),
    'Red spider': ('Red spider mite', 'ఎర్ర నల్లి (రెడ్ స్పైడర్ మైట్)'),
    'Sawfly': ('Sawfly', 'రంపపు ఈగ'),
    'Shoot borer': ('Shoot borer', 'మొవ్వు తొలిచే పురుగు'),
    'Spotted & Spiny, Pink American/Egyptian boll worm': ('Spotted, Spiny, Pink & American bollworms', 'మచ్చల, ముళ్ళ, గులాబీ మరియు శనగపచ్చ కాయ తొలిచే పురుగులు'),
    'Stalk borer': ('Stalk borer', 'కాండపు తొలిచే పురుగు'),
    'Sucking Insects': ('Sucking insects complex', 'రసం పీల్చు పురుగుల సముదాయం'),
    'sucking insects': ('Sucking insects complex', 'రసం పీల్చు పురుగుల సముదాయం'),
    'Tingid bug': ('Tingid bug (Lace bug)', 'లేస్ బగ్ / టింగిడ్ నల్లి'),
    'Tingyi bug': ('Tingid bug (Lace bug)', 'లేస్ బగ్ / టింగిడ్ నల్లి'),
    'Top borer': ('Top borer', 'పై మొవ్వు తొలిచే పురుగు'),
    'Aphid,': ('Aphids', 'పేనుబంక'),
    'Leaf folder,': ('Leaf folder', 'ఆకు చుట్టు పురుగు'),
    'Leaf roller,': ('Leaf roller', 'ఆకు చుట్టు పురుగు'),
    'Stem borer,': ('Stem borer', 'కాండం తొలిచే పురుగు'),
    'Mustard aphid,': ('Mustard aphids', 'ఆవాల పేనుబంక'),
    'Grey weevil,': ('Grey weevil', 'బూడిద రంగు ముక్కు పురుగు'),
    'White fly,': ('Whitefly', 'తెల్లదోమ'),
    'Termite': ('Termites', 'చెదలు / చెదపురుగులు'),
    'Termites': ('Termites', 'చెదలు / చెదపురుగులు'),
    'BPH': ('Brown Plant Hopper (BPH)', 'సుడి దోమ (BPH)'),
    'GLH': ('Green Leaf Hopper (GLH)', 'పచ్చ దీపపు పురుగు / పచ్చదోమ (GLH)'),
    'WBPH': ('White Backed Plant Hopper (WBPH)', 'తెల్ల వీపు దోమ (WBPH)'),
}

for r in rows:
    # Fix crop Barely -> Barley
    if r['crop'].strip() == 'Barely':
        r['crop'] = 'Barley'
        r['cropTe'] = 'బార్లీ'

    # Check pest correction
    pest_raw = r['pest'].strip()
    if pest_raw in PEST_CORRECTIONS:
        corr_en, corr_te = PEST_CORRECTIONS[pest_raw]
        r['pest'] = corr_en
        r['pestTe'] = corr_te
    elif pest_raw.endswith(','):
        clean_p = pest_raw.rstrip(',').strip()
        r['pest'] = clean_p
        if clean_p in PEST_CORRECTIONS:
            r['pest'] = PEST_CORRECTIONS[clean_p][0]
            r['pestTe'] = PEST_CORRECTIONS[clean_p][1]

# Save updated cropPestData.json
with open('project/src/features/agrochemicals/data/cropPestData.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated cropPestData.json successfully!")
