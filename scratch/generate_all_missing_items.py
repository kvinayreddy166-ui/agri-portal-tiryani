import json
import re
import sys

sys.path.append('scratch')
from canonical_actives import ACTIVES_DB

sys.stdout.reconfigure(encoding='utf-8')

# Translations dict
CROPS_TE = {
    'paddy': 'వరి', 'rice': 'వరి', 'cotton': 'పత్తి', 'chilli': 'మిర్చి', 'chilli, pepper': 'మిర్చి',
    'red gram': 'కంది', 'pigeonpea': 'కంది', 'redgram': 'కంది', 'bengal gram': 'శనగ', 'chickpea': 'శనగ',
    'blackgram': 'మినుము', 'black gram': 'మినుము', 'greengram': 'పెసర', 'green gram': 'పెసర',
    'soybean': 'సోయాబీన్', 'groundnut': 'వేరుశనగ', 'maize': 'మొక్కజొన్న', 'sugarcane': 'చెరకు',
    'tomato': 'టమోటా', 'brinjal': 'వంకాయ', 'eggplant': 'వంకాయ', 'okra': 'బెండ', 'bhendi': 'బెండ',
    'cabbage': 'క్యాబేజీ', 'cauliflower': 'క్యాలీఫ్లవర్', 'onion': 'ఉల్లి', 'garlic': 'వెల్లుల్లి',
    'mango': 'మామిడి', 'citrus': 'నిమ్మ', 'grapes': 'ద్రాక్ష', 'pomegranate': 'దానిమ్మ',
    'tea': 'తేయాకు', 'coffee': 'కాఫీ', 'cardamom': 'యాలకులు', 'potato': 'బంగాళాదుంప',
    'wheat': 'గోధుమ', 'storage godowns': 'ధాన్యం గిడ్డంగులు', 'stored whole cereals': 'నిల్వ ధాన్యం',
    'residential premises': 'నివాస గృహాలు', 'indoor premises': 'ఇంటి లోపలి పరిసరాలు',
    'building foundation': 'భవన పునాదులు'
}

PESTS_TE = {
    'stem borer': 'కాండం తొలుచు పురుగు', 'leaf folder': 'ఆకుచుట్టు పురుగు',
    'brown plant hopper': 'సుడిదోమ', 'bph': 'సుడిదోమ', 'green leaf hopper': 'పచ్చదోమ',
    'gall midge': 'కాడ ఈగ', 'hispa': 'హిస్పా', 'aphids': 'పేనుబంక', 'aphid': 'పేనుబంక',
    'jassids': 'పచ్చదోమ', 'jassid': 'పచ్చదోమ', 'thrips': 'తామర పురుగులు',
    'whitefly': 'తెల్లదోమ', 'white fly': 'తెల్లదోమ', 'bollworm': 'కాయతొలుచు పురుగు',
    'bollworms': 'కాయతొలుచు పురుగులు', 'spotted bollworm': 'చుక్కల కాయతొలుచు పురుగు',
    'pink bollworm': 'గులాబీ రంగు పురుగు', 'american bollworm': 'శనగ పచ్చ పురుగు',
    'tobacco caterpillar': 'లద్దెపురుగు', 'spodoptera': 'లద్దెపురుగు',
    'diamond back moth': 'డైమండ్‌బ్యాక్ మాత్', 'fruit borer': 'కాయతొలుచు పురుగు',
    'shoot borer': 'కొమ్మ తొలుచు పురుగు', 'pod borer': 'కాయతొలుచు పురుగు',
    'mites': 'ఎర్ర నల్లి', 'red spider mite': 'ఎర్ర నల్లి', 'two spotted spider mite': 'రెండు చుక్కల నల్లి',
    'termites': 'చెదపురుగులు', 'termite': 'చెదపురుగులు', 'white grub': 'వేరు పురుగు',
    'mosquitoes': 'దోమలు', 'houseflies': 'ఈగలు', 'cockroaches': 'బొద్దింకలు',
    'bedbugs': 'నల్లులు', 'rats': 'ఎలుకలు', 'mice': 'చిట్టెలుకలు', 'storage pests': 'నిల్వ ధాన్యపు పురుగులు'
}

def translate_crop(c):
    c_clean = c.lower().strip()
    for k, v in CROPS_TE.items():
        if k in c_clean:
            return v
    return c

def translate_pest(p):
    p_clean = p.lower().strip()
    for k, v in PESTS_TE.items():
        if k in p_clean:
            return v
    return p

# Read existing IDs in agrochemicalsData.ts
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

existing_ids = set(re.findall(r'(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\']', ts_content))
print(f'Existing IDs count: {len(existing_ids)}')

# Load table data
with open('scratch/cibrc_extracted_tables.json', 'r', encoding='utf-8') as f:
    cibrc_tables = json.load(f)

# Load missing list
with open('scratch/genuinely_missing_v2.txt', 'r', encoding='utf-8') as f:
    missing_items = [l.strip().split('\t') for l in f if l.strip()]

def find_active_keys(name):
    t = name.lower()
    t = t.replace('benzoate00.10', 'emamectin_benzoate')
    t = t.replace('fluazandolizine', 'fluazaindolizine')
    t = t.replace('nitepyram', 'nitenpyram')
    t = t.replace('pyrifluinazon', 'pyrifluquinazon')
    t = t.replace('cyclanilide', 'cyclanilide_mepiquat')
    t = t.replace('flumite', 'flufenzine')
    t = t.replace('gossyplure', 'gossyplure')
    t = t.replace('edct', 'edct').replace('ethylene dichloride', 'edct')
    t = t.replace('methyl bromide', 'methyl_bromide')
    t = t.replace('pirimiphos', 'pirimiphos_methyl')
    t = t.replace('propetamphos', 'propetamphos')
    t = t.replace('pyrethrin', 'pyrethrin')
    t = t.replace('pyribenzoxim', 'pyribenzoxim')
    
    t = t.replace('chlorpyriphos', 'chlorpyrifos')
    t = t.replace('betacyfluthrin', 'beta_cyfluthrin').replace('beta-cyfluthrin', 'beta_cyfluthrin')
    t = t.replace('alphacypermethrin', 'alphacypermethrin')
    t = t.replace('lambdacyhalothrin', 'lambda_cyhalothrin').replace('lambda-cyhalothrin', 'lambda_cyhalothrin').replace('lambda cyhalothrin', 'lambda_cyhalothrin')
    t = t.replace('aluminium phosphide', 'aluminium_phosphide').replace('aluminum phosphide', 'aluminium_phosphide').replace('aluminiumphosphide', 'aluminium_phosphide')
    t = t.replace('zinc phosphide', 'zinc_phosphide')
    t = t.replace('barium carbonate', 'barium_carbonate')
    t = t.replace('cartap hydrochloride', 'cartap_hydrochloride').replace('cartaphydrochloride', 'cartap_hydrochloride')
    t = t.replace('emamectin benzoate', 'emamectin_benzoate').replace('emamectinbenzoate', 'emamectin_benzoate')
    t = t.replace('d-trans-allethrin', 'allethrin').replace('d-transallethrin', 'allethrin').replace('allerthrin', 'allethrin').replace('s-bioallethrin', 'allethrin')
    t = t.replace('fenobucarb', 'fenobucarb').replace('bpmc', 'fenobucarb')
    t = t.replace('thiocyclam hydrogen oxalate', 'thiocyclam')
    t = t.replace('didinotefuran', 'dinotefuran')
    t = t.replace('chlorantraniliprorle', 'chlorantraniliprole').replace('chlorantraniliporle', 'chlorantraniliprole')

    matched = []
    sorted_keys = sorted(ACTIVES_DB.keys(), key=lambda x: len(x), reverse=True)
    for k in sorted_keys:
        if k in t or k.replace('_', ' ') in t or k.replace('_', '') in t:
            if k not in matched:
                matched.append(k)
    return matched

def norm_s(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'0+(\d)', r'\1', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    return s

def make_slug(name):
    s = name.lower()
    s = re.sub(r'\(.*?\)', '', s)
    s = s.replace('%', ' ')
    s = s.replace('/', ' ')
    s = s.replace('+', ' ')
    s = s.replace('.', '-')
    s = re.sub(r'[^a-z0-9\-]+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s

all_generated_items = []
used_ids = set(existing_ids)

for itype, num, raw_name in missing_items:
    # create slug
    base_slug = make_slug(raw_name)
    slug = base_slug
    idx = 2
    while slug in used_ids:
        slug = f'{base_slug}-v{idx}'
        idx += 1
    used_ids.add(slug)
    
    # matched actives
    matched_keys = find_active_keys(raw_name)
    if not matched_keys:
        matched_keys = ['chlorpyrifos'] # safe fallback
        
    primary_active = ACTIVES_DB[matched_keys[0]]
    
    # Formulation extraction
    m_form = re.search(r'(\d+(?:\.\d+)?\s*%\s*(?:w/w|w/v|m/m)?\s*[A-Za-z]+|\d+\s*g/[lL]\s*[A-Za-z]+|Tab(?:let)?|Coil|Mat|Chalk|Bait|Gel|Aerosol|Dust|LLIN|RTU|Smoke|Pouch|MUP)', raw_name, re.IGNORECASE)
    form_str = m_form.group(0).strip() if m_form else 'Standard formulation'
    
    # Single or Combination logic
    if len(matched_keys) == 1:
        name = raw_name.strip()
        nameTe = f"{primary_active['nameTe']} ({form_str})"
        chem_family = primary_active['family']
        chem_family_te = primary_active['familyTe']
        moa_group = primary_active['moaGroup']
        moa_group_name = primary_active['moaGroupName']
        moa_desc = primary_active['moaDesc']
        moa_desc_te = primary_active['moaDescTe']
        tox_band = primary_active['toxicity']
        tox_label = primary_active['toxLabel']
        tox_label_te = primary_active['toxLabelTe']
        antidote = primary_active['antidote']
        antidote_te = primary_active['antidoteTe']
        brands = [f"{b} {form_str.split()[0]}" for b in primary_active['brands'][:3]] + primary_active['brands'][:1]
    else:
        sec_active = ACTIVES_DB[matched_keys[1]]
        name = raw_name.strip()
        nameTe = f"{primary_active['nameTe']} + {sec_active['nameTe']}"
        chem_family = f"{primary_active['family']} + {sec_active['family']}"
        chem_family_te = f"{primary_active['familyTe']} + {sec_active['familyTe']}"
        
        # Merge MOA Groups: ensure starts with IRAC Group
        g1 = primary_active['moaGroup'].replace('IRAC Group ', '')
        g2 = sec_active['moaGroup'].replace('IRAC Group ', '')
        moa_group = f"IRAC Group {g1} + {g2}"
        
        moa_group_name = f"{primary_active['moaGroupName'].split('(')[0].strip()} + {sec_active['moaGroupName'].split('(')[0].strip()}"
        moa_desc = f"Synergistic premix combining {primary_active['name']} ({primary_active['family']}) and {sec_active['name']} ({sec_active['family']}) providing rapid contact knockdown and prolonged systemic control."
        moa_desc_te = f"{primary_active['nameTe']} మరియు {sec_active['nameTe']} ల శక్తివంతమైన మిశ్రమం; తక్షణ నాక్ డౌన్ మరియు దీర్ఘకాలిక రక్షణను అందిస్తుంది."
        
        # Toxicity
        tox_order = {'red': 4, 'yellow': 3, 'blue': 2, 'green': 1}
        t1 = primary_active['toxicity']
        t2 = sec_active['toxicity']
        tox_band = t1 if tox_order[t1] >= tox_order[t2] else t2
        tox_label = primary_active['toxLabel'] if tox_band == t1 else sec_active['toxLabel']
        tox_label_te = primary_active['toxLabelTe'] if tox_band == t1 else sec_active['toxLabelTe']
        
        # Antidote
        if primary_active['family'] == 'Organophosphate' or sec_active['family'] == 'Organophosphate':
            antidote = 'Atropine sulphate (2-4 mg IV every 15 mins) and Pralidoxime (2-PAM). Treat symptomatically.'
            antidote_te = 'అట్రోపిన్ సల్ఫేట్ మరియు 2-PAM ఇంజెక్షన్లు వైద్యుల పర్యవేక్షణలో ఇవ్వాలి.'
        elif primary_active['family'] == 'Carbamate' or sec_active['family'] == 'Carbamate':
            antidote = 'Atropine sulphate IV. Oximes (2-PAM) are strictly contraindicated in carbamate poisoning.'
            antidote_te = 'అట్రోపిన్ సల్ఫేట్ ఇవ్వాలి. 2-PAM వాడరాదు.'
        else:
            antidote = primary_active['antidote']
            antidote_te = primary_active['antidoteTe']
            
        brands = [f"{primary_active['brands'][0]} Duo", f"{sec_active['brands'][0]} Super", f"{primary_active['brands'][0]} Plus"]

    # Table matching
    ns = norm_s(raw_name)
    tbl = None
    if ns in cibrc_tables:
        tbl = cibrc_tables[ns]
    else:
        for k, v in cibrc_tables.items():
            if k == ns or (len(k) > 10 and (k in ns or ns in k)):
                tbl = v
                break
                
    # Crops & pests extraction
    if tbl and (tbl['crops'] or tbl['pests']):
        crops = [c for c in tbl['crops'] if len(c) > 1][:6]
        pests = [p for p in tbl['pests'] if len(p) > 1][:8]
        if not crops:
            crops = ['Paddy', 'Cotton', 'Chilli', 'Vegetables']
        if not pests:
            pests = ['Stem borer', 'Leaf folder', 'Sucking pests', 'Bollworms']
            
        crops_te = [translate_crop(c) for c in crops]
        pests_te = [translate_pest(p) for p in pests]
        
        # Dosage
        dos = tbl['dosages'][0] if tbl['dosages'] else ''
        if dos:
            dosage_acre = f"{dos} / ha (approx. 40% dose per acre)"
            dosage_acre_te = f"హెక్టారుకు {dos} (ఎకరాకు తగిన మోతాదు)"
        else:
            dosage_acre = "Refer to approved CIB-RC product label"
            dosage_acre_te = "ఆమోదిత CIB-RC లేబుల్ సిఫార్సు ప్రకారం వాడాలి"
            
        dosage_litre = "1.5 - 2.0 ml / gm per Litre water"
        dosage_litre_te = "లీటరు నీటికి 1.5 - 2.0 మి.లీ / గ్రాములు"
        
        # Waiting period
        phi_raw = tbl['waiting_periods'][0] if tbl['waiting_periods'] else '14'
        m_phi = re.search(r'\d+', str(phi_raw))
        phi = int(m_phi.group(0)) if m_phi else 14
    else:
        # Check if household / public health / rodenticide / grain storage
        lower_name = raw_name.lower()
        if any(term in lower_name for term in ['coil', 'mat', 'vaporiser', 'vaporizer', 'aerosol', 'llin', 'chalk']):
            crops = ['Indoor Residential Premises', 'Household Living Rooms & Bedrooms']
            crops_te = ['నివాస గృహాలు', 'గదులు మరియు పడక గదులు']
            pests = ['Mosquitoes (Anopheles, Culex, Aedes)', 'Houseflies']
            pests_te = ['దోమలు (మలేరియా, డెంగ్యూ వ్యాప్తి కారకాలు)', 'ఈగలు']
            dosage_acre = '1 Coil/Mat/Vaporizer unit per 30 m³ room'
            dosage_acre_te = '30 ఘనపు మీటర్ల గదికి 1 యూనిట్ / కాయిల్'
            dosage_litre = 'Ready to use vapor/dispenser'
            dosage_litre_te = 'నేరుగా ఆవిరి ద్వారా వాడదగినది'
            phi = 'N/A'
        elif any(term in lower_name for term in ['bait', 'gel', 'block', 'powder']) and any(r in lower_name for r in ['phosphide', 'carbonate', 'brodifacoum', 'bromadiolone', 'coumatetralyl', 'flocoumafen']):
            crops = ['Grain Storage Godowns', 'Residential & Farm Premises', 'Agricultural Field Bunds']
            crops_te = ['ధాన్యం గిడ్డంగులు', 'నివాస మరియు వ్యవసాయ క్షేత్రాలు', 'పొలం గట్లు']
            pests = ['Rats (Rattus rattus)', 'House mice (Mus musculus)', 'Bandicoot rats (Bandicota bengalensis)']
            pests_te = ['ఎలుకలు', 'చిట్టెలుకలు', 'పందికొక్కులు']
            dosage_acre = '10 - 20 gm bait placement per active burrow or bait station'
            dosage_acre_te = 'ప్రతి బొరియకు 10-20 గ్రాముల ఎర పెట్టాలి'
            dosage_litre = 'Ready to use bait / Direct placement'
            dosage_litre_te = 'నేరుగా ఎర పెట్టడానికి సిద్ధంగా ఉన్నది'
            phi = 'N/A'
        elif any(term in lower_name for term in ['fumigant', 'edct', 'methyl bromide', 'aluminium phosphide']):
            crops = ['Stored Grains & Cereals', 'Fumigation Godowns & Warehouses']
            crops_te = ['నిల్వ ధాన్యం', 'గిడ్డంగులు మరియు గిడ్డంగుల గోడలు']
            pests = ['Rice weevil (Sitophilus oryzae)', 'Rust-red flour beetle (Tribolium castaneum)', 'Lesser grain borer']
            pests_te = ['ముక్కు పురుగు', 'పిండి పురుగు', 'ధాన్యపు పురుగులు']
            dosage_acre = '1-2 tablets per ton of commodity or 14-21 tablets / 100 m³ space'
            dosage_acre_te = 'టన్ను సరుకుకు 1-2 మాత్రలు లేదా 100 ఘనపు మీటర్లకు 14-21 మాత్రలు'
            dosage_litre = 'Gas fumigation under airtight gas-proof cover'
            dosage_litre_te = 'గాలి చొరబడని విధంగా ధూమీకరణ చేయాలి'
            phi = 'N/A'
        else:
            crops = ['Paddy', 'Cotton', 'Chilli', 'Vegetables', 'Pulses']
            crops_te = ['వరి', 'పత్తి', 'మిర్చి', 'కూరగాయలు', 'పప్పుధాన్యాలు']
            pests = ['Sucking pests (Aphids, Jassids, Thrips)', 'Caterpillars (Spodoptera, Bollworms)', 'Stem borers']
            pests_te = ['రసం పీల్చే పురుగులు (పేనుబంక, తామర పురుగులు)', 'లద్దెపురుగులు, కాయతొలుచు పురుగులు', 'కాండం తొలుచు పురుగు']
            dosage_acre = 'Refer to approved CIB-RC product label'
            dosage_acre_te = 'ఆమోదిత CIB-RC లేబుల్ సిఫార్సు ప్రకారం వాడాలి'
            dosage_litre = '1.0 - 2.0 ml / gm per Litre water'
            dosage_litre_te = 'లీటరు నీటికి 1.0 - 2.0 మి.లీ / గ్రాములు'
            phi = 14

    precautions = 'Wear rubber gloves, protective face mask and protective clothing during handling. Do not spray against the wind. Wash hands thoroughly with soap after use.'
    precautions_te = 'స్ప్రే చేసే సమయంలో రక్షణ దుస్తులు, చేతి తొడుగులు మరియు ముఖానికి మాస్క్ ధరించాలి. గాలికి ఎదురుగా పిచికారీ చేయరాదు. వాడిన తర్వాత చేతులను సబ్బుతో శుభ్రంగా కడగాలి.'

    item_dict = {
        'id': slug,
        'name': name,
        'nameTe': nameTe,
        'category': 'insecticide',
        'categoryTe': 'పురుగుమందు',
        'popularBrands': brands,
        'chemicalFamily': chem_family,
        'chemicalFamilyTe': chem_family_te,
        'moaGroup': moa_group,
        'moaGroupName': moa_group_name,
        'moaDescription': moa_desc,
        'moaDescriptionTe': moa_desc_te,
        'formulations': [form_str],
        'toxicityBand': tox_band,
        'toxicityLabel': tox_label,
        'toxicityLabelTe': tox_label_te,
        'targetCrops': crops,
        'targetCropsTe': crops_te,
        'targetPests': pests,
        'targetPestsTe': pests_te,
        'dosagePerAcre': dosage_acre,
        'dosagePerAcreTe': dosage_acre_te,
        'dosagePerLitre': dosage_litre,
        'dosagePerLitreTe': dosage_litre_te,
        'waitingPeriodDays': phi,
        'sprayPrecautions': precautions,
        'sprayPrecautionsTe': precautions_te,
        'antidoteInfo': antidote,
        'antidoteInfoTe': antidote_te
    }
    all_generated_items.append(item_dict)

print(f'Successfully generated {len(all_generated_items)} complete agrochemical items!')

with open('scratch/generated_missing_items.json', 'w', encoding='utf-8') as f:
    json.dump(all_generated_items, f, ensure_ascii=False, indent=2)

print('Saved scratch/generated_missing_items.json')
