import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    crop_pest = json.load(f)
meta = crop_pest["metadata"]

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    agro_content = f.read()

agro_items = {}
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_content):
    agro_items[m.group(1)] = m.group(2)

keywords = [
    'dichlor', 'endosulfan', 'deltamethrin', 'imidacloprid', 'flubendiamide', 
    'fluopyr', 'thiacloprid', 'spirotetramat', 'fipronil', 'pyriproxyfen', 
    'diafenthiuron', 'cartap', 'carbofuran', 'chlorpyrifos', 'diflubenzuron',
    'zinc', 'thiocyclam', 'isocycloseram', 'etofenprox', 'fenpyroximate',
    'cyclaniliprole', 'methoxyfenozide', 'profenofos', 'propargite', 'pyraclostrobin'
]

for kw in keywords:
    matching_agro = [(k, v) for k, v in agro_items.items() if kw in k.lower() or kw in v.lower()]
    matching_meta = [k for k in meta.keys() if kw in k.lower()]
    print(f"=== Keyword: {kw} ===")
    print(f"Agro ({len(matching_agro)}): {matching_agro}")
    print(f"Meta ({len(matching_meta)}): {matching_meta}")
