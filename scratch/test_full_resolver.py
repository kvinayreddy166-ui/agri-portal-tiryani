import json
import re

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    pdf_rows = json.load(f)

unique_pdf_insecticides = sorted(list(set(r["insecticide"] for r in pdf_rows)))
print(f"Total unique PDF insecticides: {len(unique_pdf_insecticides)}")

# Load existing TS items
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

items_raw = re.findall(r'\{\s*"id":\s*"([^"]+)",(.*?)\n  \}', ts_text, re.DOTALL)
existing_items = []
for item_id, body in items_raw:
    full_str = '{\n    "id": "' + item_id + '",' + body + '\n  }'
    try:
        obj = json.loads(full_str)
        existing_items.append(obj)
    except:
        pass

print(f"Loaded {len(existing_items)} existing items from TS.")

# Create lookup indices
by_exact_name = {}
by_clean_name = {}
by_active = {}

def clean_key(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

def extract_active(s):
    s_lower = s.lower().replace('–', '-').replace('—', '-')
    s_lower = s_lower.replace('imidaclopride', 'imidacloprid')
    s_lower = s_lower.replace('chlorpyriphos', 'chlorpyrifos')
    s_lower = s_lower.replace('lambdacyhalothrin', 'lambda-cyhalothrin')
    # remove formulation types and percentages
    s_clean = re.sub(r'[\d.\s%]+(?:ec|sc|sp|sg|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet|w/w|m/m|w\.p\.|d\.p\.|c\.g\.|g\.r\.|ppm).*$', '', s_lower).strip()
    return clean_key(s_clean)

for it in existing_items:
    name = it["name"]
    by_exact_name[name.lower().strip()] = it
    by_clean_name[clean_key(name)] = it
    act = extract_active(name)
    if act and act not in by_active:
        by_active[act] = it

# Curated metadata for remaining actives
FALLBACK_METADATA = {
    "azadirachtin": {
        "nameTe": "అజాడిరక్టిన్ (వేప నూనె ఆధారితం)",
        "chemicalFamily": "Botanical / Limonoid (Azadirachtin)",
        "chemicalFamilyTe": "బొటానికల్ / వేప ఆధారితం",
        "iracGroup": "IRAC Group UNE",
        "moaGroupName": "Antifeedant, Repellent and Ecdysone Receptor Disruptor",
        "moaDescription": "Acts as an insect growth regulator (IGR), antifeedant, repellent, and oviposition deterrent disrupting ecdysone titer.",
        "moaDescriptionTe": "కీటకాల ఎదుగుదలను అడ్డుకుంటుంది (IGR), తినకుండా చేస్తుంది, గుడ్లు పెట్టడాన్ని నిరోధిస్తుంది.",
        "popularBrands": ["Neemazal (Parry)", "Econeem (Biostadt)", "Nimbecidine (Stanes)", "Achook", "Multineem"],
        "toxicityBand": "green",
        "toxicityLabel": "Slightly Toxic (Green)",
        "toxicityLabelTe": "స్వల్ప విషపూరితం (ఆకుపచ్చ)",
        "antidoteInfo": "Treat symptomatically. Non-toxic to humans and higher animals.",
        "antidoteInfoTe": "లక్షణాల ఆధారంగా చికిత్స చేయాలి. ప్రమాదకరం కాదు.",
        "waitingPeriodDays": 3,
        "sprayPrecautions": "Safe for natural beneficial insects and honeybees. Apply in evening for highest efficacy.",
        "sprayPrecautionsTe": "మిత్రపురుగులకు హాని చేయదు. సాయంత్రం వేళల్లో పిచికారీ చేయడం ఉత్తమం."
    },
    "bacillus": {
        "nameTe": "బాసిల్లస్ తురింజియెన్సిస్ (బిటి)",
        "chemicalFamily": "Microbial / Bacterial Bio-pesticide",
        "chemicalFamilyTe": "జీవసంబంధ క్రిమిసంహారిణి - బ్యాక్టీరియా",
        "iracGroup": "IRAC Group 11A",
        "moaGroupName": "Microbial disruptors of insect midgut membranes (Bt endotoxins)",
        "moaDescription": "Endotoxin crystal proteins are ingested and activated in the alkaline midgut, creating pores that cause gut cell lysis and starvation.",
        "moaDescriptionTe": "కీటకాలు తిన్నప్పుడు పేగు గోడలలో రంధ్రాలు ఏర్పడి పక్షవాతం వచ్చి 2-3 రోజుల్లో చనిపోతాయి.",
        "popularBrands": ["Dipel (Valent)", "Biobit", "Halt (Wockhardt)", "Delfin (Certis)", "Biolep"],
        "toxicityBand": "green",
        "toxicityLabel": "Slightly Toxic (Green)",
        "toxicityLabelTe": "స్వల్ప విషపూరితం (ఆకుపచ్చ)",
        "antidoteInfo": "Treat symptomatically. Environmentally safe bio-pesticide.",
        "antidoteInfoTe": "లక్షణాల ఆధారంగా చికిత్స చేయాలి. పర్యావరణహిత జీవ నియంత్రణ.",
        "waitingPeriodDays": 3,
        "sprayPrecautions": "Ensure fresh preparation. Best applied during early larval instars in cloudy weather or late afternoon.",
        "sprayPrecautionsTe": "లేత లార్వాల దశలో సాయంత్రం వేళల్లో పిచికారీ చేస్తే మంచి ఫలితాలు వస్తాయి."
    },
    "beauveria": {
        "nameTe": "బ్యూవేరియా బాసియానా",
        "chemicalFamily": "Entomopathogenic Fungal Bio-insecticide",
        "chemicalFamilyTe": "కీటక నాశక శిలీంద్రం (బయో-పెస్టిసైడ్)",
        "iracGroup": "IRAC Microbial",
        "moaGroupName": "Fungal cuticle penetration and white muscardine infection",
        "moaDescription": "Fungal conidia germinate on insect cuticle, penetrate using enzymes (PR1, chitinase), and proliferate inside hemolymph causing white muscardine death.",
        "moaDescriptionTe": "శిలీంద్ర బీజాలు కీటకం శరీరంపై మొలకెత్తి, లోపలికి ప్రవేశించి తెల్లటి బూజు తెగులును కలిగించి చంపుతాయి.",
        "popularBrands": ["Biorin", "Beverin", "Daman (Multiplex)", "Bio-Magic", "Eco-Guard"],
        "toxicityBand": "green",
        "toxicityLabel": "Slightly Toxic (Green)",
        "toxicityLabelTe": "స్వల్ప విషపూరితం (ఆకుపచ్చ)",
        "antidoteInfo": "Non-toxic biological agent. Treat symptomatically.",
        "antidoteInfoTe": "హానికరం కాదు. లక్షణాల ఆధారంగా చికిత్స చేయాలి.",
        "waitingPeriodDays": 1,
        "sprayPrecautions": "Never mix with chemical fungicides. High humidity (>70%) enhances spore germination.",
        "sprayPrecautionsTe": "శిలీంద్ర సంహారిణులతో (ఫంగిసైడ్స్) ఎప్పుడూ కలపకూడదు. అధిక తేమ ఉన్నప్పుడు పిచికారీ చేయాలి."
    },
    "carbaryl": {
        "nameTe": "కార్బరిల్",
        "chemicalFamily": "Carbamate",
        "chemicalFamilyTe": "కార్బమేట్",
        "iracGroup": "IRAC Group 1A",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Reversibly inhibits acetylcholinesterase enzyme, causing acetylcholine buildup and hyperexcitation of the insect nervous system.",
        "moaDescriptionTe": "కీటకాల ఎసిటైల్‌కోలినెస్టరేజ్ ఎంజైమ్‌ను నిరోధించి నాడీ వ్యవస్థను స్తంభింపజేస్తుంది.",
        "popularBrands": ["Sevin 50 WP (Bayer)", "Hexavin", "Tafvin 50", "Carbaryl Dust"],
        "toxicityBand": "blue",
        "toxicityLabel": "Moderately Toxic (Blue)",
        "toxicityLabelTe": "మధ్యస్థ విషపూరితం (నీలం)",
        "antidoteInfo": "Atropine sulfate (2-4 mg IV every 15-30 min until atropinization). Do NOT use 2-PAM/oximes for carbamates.",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ ఇంజెక్షన్ ఇవ్వాలి. 2-PAM వాడకూడదు.",
        "waitingPeriodDays": 7,
        "sprayPrecautions": "Highly toxic to honeybees. Avoid spraying during active bloom / pollination.",
        "sprayPrecautionsTe": "తేనెటీగలకు అత్యంత విషపూరితం. పువ్వులు పూసే సమయంలో వాడరాదు."
    },
    "dichlorvos": {
        "nameTe": "డైక్లోర్‌వాస్ (DDVP)",
        "chemicalFamily": "Organophosphate",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Fast-acting contact and vapor action fumigant insecticide. Inhibits acetylcholinesterase in nerve synapses.",
        "moaDescriptionTe": "ఆవిరి మరియు స్పర్శ ద్వారా వెంటనే పనిచేసే పురుగుమందు. నాడీ మండలంలో ఎంజైమ్‌ను స్తంభింపజేస్తుంది.",
        "popularBrands": ["Nuvan (Syngenta)", "Vapona", "Doom", "Marvex Super 76%"],
        "toxicityBand": "red",
        "toxicityLabel": "Extremely Toxic (Red)",
        "toxicityLabelTe": "అత్యంత విషపూరితం (ఎరుపు)",
        "antidoteInfo": "Atropine sulphate (2-4 mg IV) + PAM (Pralidoxime) 1-2g IV slowly under medical care.",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ మరియు PAM (ప్రాలిడాక్సిమ్) ఇంజెక్షన్ ఇవ్వాలి.",
        "waitingPeriodDays": 10,
        "sprayPrecautions": "Use protective mask and suit. High vapor pressure; avoid inhaling fumes.",
        "sprayPrecautionsTe": "రక్షణ తొడుగులు, మాస్క్ తప్పనిసరిగా ధరించాలి. ఆవిరి పీల్చకుండా జాగ్రత్త వహించాలి."
    },
    "dicofol": {
        "nameTe": "డైకోఫాల్",
        "chemicalFamily": "Organochlorine / Diphenyl acaricide",
        "chemicalFamilyTe": "ఆర్గానోక్లోరిన్ నల్లి నివారిణి",
        "iracGroup": "IRAC Group 29 / Acaricide",
        "moaGroupName": "Mite nerve cell function disruption / Oxidative phosphorylation inhibitor",
        "moaDescription": "Specific non-systemic contact miticide with ovicidal and residual adulticidal action against all active stages of mites.",
        "moaDescriptionTe": "కేవలం నల్లుల నివారణకు మాత్రమే పనిచేసే స్పర్శ మందు. గుడ్లు, పిల్ల మరియు పెద్ద నల్లులను సమర్థవంతంగా అరికడుతుంది.",
        "popularBrands": ["Kelthane (Dow)", "Colonizer", "Dicomite", "Hilfol 18.5 EC"],
        "toxicityBand": "yellow",
        "toxicityLabel": "Highly Toxic (Yellow)",
        "toxicityLabelTe": "అత్యధిక విషపూరితం (పసుపు)",
        "antidoteInfo": "No specific antidote. Treat symptomatically. Gastric lavage with activated charcoal.",
        "antidoteInfoTe": "ప్రత్యేక విరుగుడు లేదు. కడుపును శుభ్రపరచాలి.",
        "waitingPeriodDays": 14,
        "sprayPrecautions": "Ensure complete coverage of foliage undersides where mites feed.",
        "sprayPrecautionsTe": "ఆకుల అడుగు భాగాన పిచికారీ చేయాలి."
    },
    "methomyl": {
        "nameTe": "మెథోమైల్",
        "chemicalFamily": "Carbamate (Oxime carbamate)",
        "chemicalFamilyTe": "కార్బమేట్",
        "iracGroup": "IRAC Group 1A",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Broad-spectrum systemic and contact insecticide with rapid knockdown and ovicidal properties.",
        "moaDescriptionTe": "స్పర్శ మరియు దైహిక గుణాలు కలిగిన మందు. గుడ్లు మరియు పురుగులను వెంటనే నాశనం చేస్తుంది.",
        "popularBrands": ["Lannate (Corteva)", "Dunet (Dhanuka)", "Kuil 40 SP"],
        "toxicityBand": "yellow",
        "toxicityLabel": "Highly Toxic (Yellow)",
        "toxicityLabelTe": "అత్యధిక విషపూరితం (పసుపు)",
        "antidoteInfo": "Atropine sulfate IV. Do NOT administer oximes (2-PAM).",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ ఇవ్వాలి. 2-PAM వాడకూడదు.",
        "waitingPeriodDays": 14,
        "sprayPrecautions": "Handle powder with extreme care to avoid inhalation.",
        "sprayPrecautionsTe": "పౌడర్ గాల్లోకి ఎగరకుండా జాగ్రత్తగా కలపాలి."
    },
    "methyl parathion": {
        "nameTe": "మిథైల్ పారాథియాన్",
        "chemicalFamily": "Organophosphate",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Potent non-systemic insecticide and acaricide with contact, stomach, and vapor action.",
        "moaDescriptionTe": "స్పర్శ మరియు ఆవిరి ద్వారా పనిచేసే బలమైన పురుగుమందు.",
        "popularBrands": ["Metacid (Bayer)", "Folidol Dust", "Paramar"],
        "toxicityBand": "red",
        "toxicityLabel": "Extremely Toxic (Red)",
        "toxicityLabelTe": "అత్యంత విషపూరితం (ఎరుపు)",
        "antidoteInfo": "Atropine sulfate (2-4 mg IV) repeated every 10-15 mins + Pralidoxime (PAM).",
        "antidoteInfoTe": "అట్రోపిన్ మరియు PAM ఇంజెక్షన్ వెంటనే ఇవ్వాలి.",
        "waitingPeriodDays": 21,
        "sprayPrecautions": "Extremely toxic. Wear full chemical suit, boots, and respirator.",
        "sprayPrecautionsTe": "అత్యంత విషపూరితం. పూర్తి రక్షణ దుస్తులు ధరించాలి."
    },
    "npv": {
        "nameTe": "న్యూక్లియోపాలిహెడ్రోవైరస్ (NPV)",
        "chemicalFamily": "Baculovirus Bio-insecticide",
        "chemicalFamilyTe": "వైరస్ జీవసంబంధ పురుగుమందు",
        "iracGroup": "IRAC Group 31",
        "moaGroupName": "Baculoviruses (Nucleopolyhedroviruses - Occlusion bodies)",
        "moaDescription": "Occlusion bodies dissolve in insect midgut releasing virions that replicate in cell nuclei, causing insect liquefaction and death.",
        "moaDescriptionTe": "లార్వాల పేగుల్లో వైరస్ వృద్ధి చెంది శరీర కణజాలం ద్రవంగా మారి పురుగు చనిపోతుంది.",
        "popularBrands": ["Helicide", "Spodocide", "Biovirus-H", "Helico-Kill"],
        "toxicityBand": "green",
        "toxicityLabel": "Slightly Toxic (Green)",
        "toxicityLabelTe": "స్వల్ప విషపూరితం (ఆకుపచ్చ)",
        "antidoteInfo": "Non-toxic biological agent. Wash with soap and water.",
        "antidoteInfoTe": "హానికరం కాదు. సబ్బు నీటితో శుభ్రం చేసుకోవాలి.",
        "waitingPeriodDays": 1,
        "sprayPrecautions": "Add 0.1% teepol / jaggery (0.5%) as phagostimulant. Spray in late evening to protect against UV deactivation.",
        "sprayPrecautionsTe": "బెల్లం నీరు కలిపి సాయంత్రం వేళల్లో పిచికారీ చేస్తే పురుగులు ఇష్టంగా తింటాయి."
    },
    "phorate": {
        "nameTe": "ఫోరేట్ (గుళికలు)",
        "chemicalFamily": "Organophosphate (Dithiophosphate)",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్ గుళికలు",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Systemic soil insecticide and nematicide. Rapidly absorbed by roots and translocated to protect foliar parts.",
        "moaDescriptionTe": "వేర్ల ద్వారా గ్రహించబడి మొక్క అంతటా ప్రవహించి రసం పీల్చే పురుగులు, కొమ్మ తొలిచే పురుగులను నివారిస్తుంది.",
        "popularBrands": ["Thimet 10G (UPL)", "Foratox", "Granutox", "Volphor 10G"],
        "toxicityBand": "red",
        "toxicityLabel": "Extremely Toxic (Red)",
        "toxicityLabelTe": "అత్యంత విషపూరితం (ఎరుపు)",
        "antidoteInfo": "Atropine sulfate + Pralidoxime (PAM) under medical supervision.",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ మరియు PAM వెంటనే ఇవ్వాలి.",
        "waitingPeriodDays": 30,
        "sprayPrecautions": "Do not handle granules with bare hands. Incorporate into moist soil immediately.",
        "sprayPrecautionsTe": "చేతులతో నేరుగా తాకరాదు. తేమ ఉన్న నేలలో వేసి వెంటనే మట్టితో కప్పాలి."
    },
    "phosphamidon": {
        "nameTe": "ఫాస్ఫామిడాన్",
        "chemicalFamily": "Organophosphate",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Systemic insecticide and acaricide with rapid foliar penetration and xylem transport.",
        "moaDescriptionTe": "దైహిక పురుగుమందు. ఆకుల ద్వారా ప్రవేశించి రసం పీల్చే పురుగులను నివారిస్తుంది.",
        "popularBrands": ["Dimecron (Syngenta)", "Sumidon", "Phamidon 40 SL"],
        "toxicityBand": "red",
        "toxicityLabel": "Extremely Toxic (Red)",
        "toxicityLabelTe": "అత్యంత విషపూరితం (ఎరుపు)",
        "antidoteInfo": "Atropine sulfate (2-4 mg IV) + PAM.",
        "antidoteInfoTe": "అట్రోపిన్ మరియు PAM ఇంజెక్షన్ ఇవ్వాలి.",
        "waitingPeriodDays": 21,
        "sprayPrecautions": "Toxic to all mammals and aquatic fauna.",
        "sprayPrecautionsTe": "నీటి వనరులకు దూరంగా జాగ్రత్తగా పిచికారీ చేయాలి."
    },
    "thiometon": {
        "nameTe": "థియోమెటాన్",
        "chemicalFamily": "Organophosphate",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Systemic insecticide and acaricide controlling sucking insects on fruit and vegetable crops.",
        "moaDescriptionTe": "దైహిక మరియు స్పర్శ మందు. రసం పీల్చే పురుగులను నివారిస్తుంది.",
        "popularBrands": ["Ekatin 25 EC", "Thiomet"],
        "toxicityBand": "yellow",
        "toxicityLabel": "Highly Toxic (Yellow)",
        "toxicityLabelTe": "అత్యధిక విషపూరితం (పసుపు)",
        "antidoteInfo": "Atropine sulfate IV + PAM.",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ మరియు PAM ఇవ్వాలి.",
        "waitingPeriodDays": 21,
        "sprayPrecautions": "Avoid inhalation of spray mist.",
        "sprayPrecautionsTe": "స్ప్రే పొగమంచును పీల్చకుండా జాగ్రత్తపడండి."
    },
    "triazophos": {
        "nameTe": "ట్రయాజోఫాస్",
        "chemicalFamily": "Organophosphate",
        "chemicalFamilyTe": "ఆర్గానోఫాస్ఫేట్",
        "iracGroup": "IRAC Group 1B",
        "moaGroupName": "Acetylcholinesterase (AChE) inhibitors",
        "moaDescription": "Broad-spectrum insecticide and acaricide with translaminar and contact action especially effective against lepidopteran larvae and whiteflies.",
        "moaDescriptionTe": "ట్రాన్స్‌లామినార్ గుణం కలిగిన మందు. తెల్లదోమ మరియు కాయ తొలిచే పురుగులను నివారిస్తుంది.",
        "popularBrands": ["Hostathion (Bayer)", "Trizocel", "Sutathion", "Spark 40 EC"],
        "toxicityBand": "yellow",
        "toxicityLabel": "Highly Toxic (Yellow)",
        "toxicityLabelTe": "అత్యధిక విషపూరితం (పసుపు)",
        "antidoteInfo": "Atropine sulfate + Pralidoxime (PAM).",
        "antidoteInfoTe": "అట్రోపిన్ సల్ఫేట్ మరియు PAM ఇంజెక్షన్ ఇవ్వాలి.",
        "waitingPeriodDays": 21,
        "sprayPrecautions": "Do not spray in windy conditions. Maintain recommended pre-harvest interval.",
        "sprayPrecautionsTe": "గాలి ఎక్కువగా ఉన్నప్పుడు పిచికారీ చేయరాదు."
    },
    "verticillium": {
        "nameTe": "వర్టిసిల్లియం లెకాని (లెకానిసిల్లియం)",
        "chemicalFamily": "Entomopathogenic Fungal Bio-insecticide",
        "chemicalFamilyTe": "కీటక నాశక శిలీంద్రం",
        "iracGroup": "IRAC Microbial",
        "moaGroupName": "Fungal parasitic penetration of sucking pests & whiteflies",
        "moaDescription": "Entomopathogenic fungus producing hyphae that penetrate the soft body wall of scales, mealybugs, aphids, and whiteflies.",
        "moaDescriptionTe": "తెల్లదోమ, పిండినల్లి, పేనుబంక శరీరంపై మొలకెత్తి వ్యాప్తి చెందే జీవ శిలీంద్రం.",
        "popularBrands": ["Verticel", "Mealy-Kill", "Bio-Catch", "Vertelec"],
        "toxicityBand": "green",
        "toxicityLabel": "Slightly Toxic (Green)",
        "toxicityLabelTe": "స్వల్ప విషపూరితం (ఆకుపచ్చ)",
        "antidoteInfo": "Non-toxic. Treat symptomatically.",
        "antidoteInfoTe": "హానికరం కాదు.",
        "waitingPeriodDays": 1,
        "sprayPrecautions": "Apply with wetting agent in evening. Avoid chemical fungicide tank mixes.",
        "sprayPrecautionsTe": "సాయంత్రం వేళల్లో కొద్దిగా సబ్బు నీరు కలిపి పిచికారీ చేయాలి."
    }
}

# Test matching every single unique insecticide
def resolve_insecticide_meta(ins_name):
    norm = ins_name.lower().strip()
    norm_clean = clean_key(norm)
    act = extract_active(norm)
    
    # 1. Check exact TS
    if norm in by_exact_name:
        return (by_exact_name[norm], "exact_ts")
    if norm_clean in by_clean_name:
        return (by_clean_name[norm_clean], "clean_ts")
    if act in by_active:
        return (by_active[act], "active_ts")
        
    # 2. Check fallback actives
    for fb_key, fb_val in FALLBACK_METADATA.items():
        if fb_key in norm:
            return (fb_val, f"fallback_{fb_key}")
            
    # 3. Substring in TS
    for k, v in by_clean_name.items():
        if len(act) > 4 and (act in k or k in act):
            return (v, "sub_ts")
            
    return (None, "missing")

success = 0
failures = []
for ins in unique_pdf_insecticides:
    meta, source = resolve_insecticide_meta(ins)
    if meta:
        success += 1
    else:
        failures.append(ins)

print(f"\nRESOLVED: {success} / {len(unique_pdf_insecticides)} ({success / len(unique_pdf_insecticides) * 100:.1f}%)")
if failures:
    print("Failures:", failures)
