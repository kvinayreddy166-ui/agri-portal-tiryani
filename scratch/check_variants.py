import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    agro_content = f.read()

agro_items = {}
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_content):
    agro_items[m.group(1)] = m.group(2)

additional_agro_variants = {
    'alphacypermethrin-10-sc': 8, # Alphamethrin 10% EC
    'cypermethrin-0-25-dp': 33, # Cypermethrin 25% EC
    'deltamethrin-2-5-wp': 37, # Deltamethrin 2.8% EC
    'fenvalerate-02-conc': 56, # Fenvalerate 20% EC
    'imidacloprid-70-ws': 120, # Thiamethoxam 70% WS? No, Imidacloprid 70% WS! Wait, what row is Imidacloprid 70% WS?
}

for aid, sno in additional_agro_variants.items():
    if aid in agro_items:
        print(f"Variant '{aid}' ({agro_items[aid]}) -> S.No {sno}")
    else:
        print(f"Variant '{aid}' not found!")
