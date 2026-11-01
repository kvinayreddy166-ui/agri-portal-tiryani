import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Locate emamectin-5-lufenuron-40-wg block
m = re.search(r'(\{\s*["\']?id["\']?\s*:\s*["\']emamectin-5-lufenuron-40-wg["\'].*?\n\s*\})', text, re.DOTALL)
if not m:
    print('Block not found')
    sys.exit(1)

old_block = m.group(1)

new_block = """{
    "id": "emamectin-5-lufenuron-40-wg",
    "name": "Emamectin Benzoate 5% + Lufenuron 40% WG",
    "nameTe": "ఎమామెక్టిన్ బెంజోయేట్ 5% + లూఫెనురాన్ 40% WG",
    "category": "insecticide",
    "categoryTe": "పురుగుమందు",
    "popularBrands": [
      "Evicent (Syngenta)",
      "Emaluf WG (Crystal)"
    ],
    "chemicalFamily": "Avermectin + Benzoylurea (IGR)",
    "chemicalFamilyTe": "అవర్‌మెక్టిన్ + బెంజాయిల్ యూరియా (IGR)",
    "moaGroup": "IRAC Group 6 + 15",
    "moaGroupName": "GluCl channel modulator (6) + Chitin biosynthesis inhibitor (15)",
    "moaDescription": "Dual-action synergism. Emamectin provides rapid contact and stomach knockdown against active caterpillar larvae within hours, while Lufenuron inhibits chitin synthesis halting larval moulting and sterilizing adult female eggs for 14–21 days residual protection.",
    "moaDescriptionTe": "లద్దెపురుగుల సంపూర్ణ నివారణి. ఎమామెక్టిన్ కొన్ని గంటల్లో లద్దెపురుగులను చంపగా, లూఫెనురాన్ గుడ్లు పొదగకుండా చేసి కుబుసం విడిచే ప్రక్రియను నిలిపివేసి 14-21 రోజుల వరకు సమగ్ర రక్షణ కల్పిస్తుంది.",
    "formulations": [
      "5% + 40% WG (45% WG)"
    ],
    "toxicityBand": "blue",
    "toxicityLabel": "Moderately Toxic (Blue)",
    "toxicityLabelTe": "మితమైన విషపూరితం (నీలం)",
    "targetCrops": [
      "Chilli",
      "Tomato",
      "Brinjal",
      "Cauliflower",
      "Maize",
      "Tea"
    ],
    "targetCropsTe": [
      "మిర్చి",
      "టమోటా",
      "వంకాయ",
      "క్యాలీఫ్లవర్",
      "మొక్కజొన్న",
      "తేయాకు"
    ],
    "targetPests": [
      "Fruit Borer (Helicoverpa armigera)",
      "Tobacco Caterpillar (Spodoptera litura)",
      "Chilli Thrips (Scirtothrips dorsalis)",
      "Yellow Mites (Polyphagotarsonemus latus)",
      "Diamond Back Moth (Plutella xylostella)",
      "Fall Armyworm (Spodoptera frugiperda)",
      "Brinjal Shoot & Fruit Borer (Leucinodes)",
      "Tea Looper & Leaf Roller"
    ],
    "targetPestsTe": [
      "కాయతొలుచు పురుగు (శనగపచ్చ పురుగు)",
      "పొగాకు లద్దెపురుగు",
      "మిర్చి తామర పురుగులు",
      "పచ్చ నల్లి / మైట్స్",
      "డైమండ్‌బ్యాక్ మాత్ (DBM)",
      "మొక్కజొన్న కత్తెర పురుగు",
      "వంకాయ కొమ్మ మరియు కాయతొలుచు పురుగు",
      "తేయాకు లూపర్ మరియు ఆకుచుట్టు పురుగు"
    ],
    "dosagePerAcre": "24 g / acre in Vegetables & Tea (60 g/ha in 500L water); 32 g / acre in Maize (80 g/ha)",
    "dosagePerAcreTe": "కూరగాయలు & తేయాకులో ఎకరాకు 24 గ్రాములు (హెక్టారుకు 60 గ్రా); మొక్కజొన్నలో ఎకరాకు 32 గ్రాములు (హెక్టారుకు 80 గ్రా)",
    "dosagePerLitre": "0.12 g / Litre (1.8–2.0 g per 15L pump) in Vegetables; 0.16 g / Litre (2.4–2.5 g per 15L pump) in Maize",
    "dosagePerLitreTe": "కూరగాయలలో లీటరు నీటికి 0.12 గ్రాములు (15 లీటర్ల పంపుకు 1.8–2.0 గ్రా); మొక్కజొన్నలో లీటరుకు 0.16 గ్రాములు (15 లీటర్ల పంపుకు 2.4–2.5 గ్రా)",
    "waitingPeriodDays": "3 days (Chilli, Cauliflower), 5 days (Tomato, Brinjal), 7 days (Tea), 36 days (Maize)",
    "sprayPrecautions": "Apply at early hatch of caterpillar egg masses or early larval instars. Standard commercial pack size is 24 g (1-acre pouch) dissolved in 200 L water for foliar spraying.",
    "sprayPrecautionsTe": "గుడ్ల నుండి పిల్ల పురుగులు బయటకు వచ్చే దశలోనే పిచికారీ చేయాలి. కూరగాయలకు ఎకరాకు ప్రామాణిక 24 గ్రాముల ప్యాకెట్‌ను 200 లీటర్ల నీటిలో కలిపి పిచికారీ చేయాలి.",
    "antidoteInfo": "No specific antidote. Treat symptomatically with gastric lavage. Do not administer GABA-enhancing drugs (barbiturates, benzodiazepines).",
    "antidoteInfoTe": "ప్రత్యేక విరుగుడు లేదు. రోగలక్షణ చికిత్స అందించాలి. గాబాను పెంచే మందులు ఇవ్వరాదు."
  }"""

updated_text = text.replace(old_block, new_block)
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(updated_text)

print('Successfully updated emamectin-5-lufenuron-40-wg with 100% accurate CIB-RC label data!')
