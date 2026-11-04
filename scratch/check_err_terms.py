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

terms = ['emamectin', 'fenobucarb', 'fenvalerate', 'lambda', 'permethrin', 'spinetoram', 'spinosad', 'carbaryl', 'dicofol']

for t in terms:
    print(f"\n=== Term: {t} ===")
    print("Meta:", [k for k in meta.keys() if t in k])
    print("Agro:", [(k, v) for k, v in agro_items.items() if t in k or t in v.lower()])
