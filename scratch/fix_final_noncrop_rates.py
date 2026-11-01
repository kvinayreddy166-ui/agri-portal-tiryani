import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ts_file = 'project/src/features/agrochemicals/data/agrochemicalsData.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

header = text[:start_pos]
items = json.loads(text[start_pos:end_pos])
footer = text[end_pos:]

for item in items:
    iid = item.get('id', '')
    if 'gel' in iid or 'bait' in iid:
        item['dosagePerLitre'] = "Bait / Spot application (Do not spray in water)"
        item['dosagePerLitreTe'] = "ఎర / చుక్కల విధానం (నీటితో పిచికారీ చేయరాదు)"
    elif 'smoke' in iid or 'vp' in iid:
        item['dosagePerLitre'] = "Vaporizer / Smoke generator for enclosed spaces (Do not dilute in water)"
        item['dosagePerLitreTe'] = "మూసిన గదులలో పొగ/వేపరైజర్ విధానం (నీటిలో కలపరాదు)"
    elif 'enamel' in iid:
        item['dosagePerLitre'] = "Surface paint / enamel coating (Do not spray on crops)"
        item['dosagePerLitreTe'] = "ఉపరితల ఎనామెల్ పూత (పంటలపై పిచికారీ చేయరాదు)"
    elif 'gossyplure' in iid:
        item['dosagePerLitre'] = "Pheromone mating disruptor dispenser (Do not dilute in water)"
        item['dosagePerLitreTe'] = "ఫెరమోన్ ఎర డబ్బా / వాక్స్ విధానం (నీటిలో కలపరాదు)"
    elif 'ddt-75-wp' in iid:
        item['dosagePerLitre'] = "Public health indoor residual spray (NVBDCP malaria vector control only)"
        item['dosagePerLitreTe'] = "ప్రజారోగ్య మలేరియా నియంత్రణ పిచికారీ కొరకు మాత్రమే"
    elif 'malathion-96-ulv' in iid:
        item['dosagePerLitre'] = "Ultra Low Volume (ULV) application (Apply undiluted with specialized ULV sprayer)"
        item['dosagePerLitreTe'] = "అల్ట్రా లో వాల్యూమ్ (ULV) పిచికారీ (నీరు కలపకుండా ప్రత్యేక స్ప్రేయర్‌తో వాడాలి)"
    elif iid in ['deltamethrin-0-02-allethrin-0-13-ec', 'deltamethrin-0-05-allethrin-0-04-ec', 'fenitrothion-2-spray']:
        item['dosagePerLitre'] = "Ready to use household insecticide. Do not dilute for crop spraying."
        item['dosagePerLitreTe'] = "గృహ వినియోగ పురుగుమందు. పంట పిచికారీకి నీటిలో కలపరాదు."
    elif iid == 'didinotefuran-12-thiamethoxam-22-5-pymetrozine-30-wg':
        item['dosagePerLitre'] = "Refer to manufacturer package leaflet"
        item['dosagePerLitreTe'] = "తయారీదారు ప్యాకేజీ కరపత్రాన్ని చూడండి"
    elif iid == 'chlorpyriphos-02-w-w-ec':
        item['dosagePerLitre'] = "Ready to use household insecticide. Do not dilute for crop spraying."
        item['dosagePerLitreTe'] = "గృహ వినియోగ పురుగుమందు. పంట పిచికారీకి నీటిలో కలపరాదు."

# Write back
with open(ts_file, 'w', encoding='utf-8') as f:
    f.write(header + json.dumps(items, indent=2, ensure_ascii=False) + footer)

print(f"Successfully cleaned non-crop placeholders.")
