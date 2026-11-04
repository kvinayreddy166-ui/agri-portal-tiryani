import openpyxl
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load cropPestData.json metadata keys
with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    crop_pest = json.load(f)
meta = crop_pest["metadata"]

# Load agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    agro_content = f.read()

agro_items = []
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_content):
    agro_items.append({"id": m.group(1), "name": m.group(2)})

# Helper to normalize chemical name for matching
def normalize(name):
    s = name.lower()
    # remove punctuation and spaces
    s = re.sub(r'[\s\-\+\/\%]+', '', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

meta_norm = {}
for k, v in meta.items():
    meta_norm[normalize(k)] = k
    if "insecticideName" in v:
        meta_norm[normalize(v["insecticideName"])] = k

agro_norm = {}
for item in agro_items:
    agro_norm[normalize(item["id"])] = item["id"]
    agro_norm[normalize(item["name"])] = item["id"]

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

matched_meta = {}
matched_agro = {}
unmatched = []

for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    brands = ws.cell(r, 3).value
    if not chem:
        continue
    chem = chem.strip()
    norm = normalize(chem)
    
    mk = meta_norm.get(norm)
    ak = agro_norm.get(norm)
    
    # Try alternate forms if not matched directly
    if not mk:
        # replace e.g. 'chlorpyriphos' with 'chlorpyrifos'
        alt = norm.replace('chlorpyriphos', 'chlorpyrifos').replace('imidachloprid', 'imidacloprid').replace('alphamethrin', 'alphacypermethrin')
        mk = meta_norm.get(alt)
    if not ak:
        alt = norm.replace('chlorpyriphos', 'chlorpyrifos').replace('imidachloprid', 'imidacloprid').replace('alphamethrin', 'alphacypermethrin')
        ak = agro_norm.get(alt)
        
    print(f"Row {r} [S.No {sno}]: '{chem}' -> meta: {mk}, agro: {ak}")

