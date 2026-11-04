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

agro_items = {}
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_content):
    agro_items[m.group(1)] = m.group(2)

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

# Manual or known overrides for matching rows to metadata keys and agro ids
# Let's inspect each row and match
rows = []
for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    brands = ws.cell(r, 3).value
    if chem:
        rows.append({
            "sno": int(sno) if isinstance(sno, float) else sno,
            "chem": chem.strip(),
            "brands": str(brands).strip() if brands else ""
        })

def norm(text):
    s = text.lower()
    s = s.replace('chlorpyriphos', 'chlorpyrifos').replace('imidachloprid', 'imidacloprid')
    s = s.replace('alphamethrin', 'alphacypermethrin').replace('prefenophos', 'profenofos')
    s = s.replace('pyriproxifen', 'pyriproxyfen').replace('difenthuron', 'diafenthiuron')
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

meta_keys_norm = {norm(k): k for k in meta.keys()}
for k, v in meta.items():
    if "insecticideName" in v:
        meta_keys_norm[norm(v["insecticideName"])] = k

agro_ids_norm = {norm(k): k for k in agro_items.keys()}
for k, v in agro_items.items():
    agro_ids_norm[norm(v)] = k

results = []
for item in rows:
    sno = item["sno"]
    chem = item["chem"]
    n = norm(chem)
    
    mk = meta_keys_norm.get(n)
    ak = agro_ids_norm.get(n)
    
    results.append({
        "sno": sno,
        "chem": chem,
        "meta": mk,
        "agro": ak
    })

print(f"Total rows: {len(results)}")
matched_both = [r for r in results if r["meta"] and r["agro"]]
matched_agro_only = [r for r in results if not r["meta"] and r["agro"]]
matched_meta_only = [r for r in results if r["meta"] and not r["agro"]]
unmatched = [r for r in results if not r["meta"] and not r["agro"]]

print(f"Matched both: {len(matched_both)}")
print(f"Matched agro only: {len(matched_agro_only)}")
print(f"Matched meta only: {len(matched_meta_only)}")
print(f"Unmatched: {len(unmatched)}")

print("\n--- Unmatched items: ---")
for u in unmatched:
    print(f"[{u['sno']}] {u['chem']}")

print("\n--- Agro only items (first 10): ---")
for a in matched_agro_only[:10]:
    print(f"[{a['sno']}] {a['chem']} -> {a['agro']}")
