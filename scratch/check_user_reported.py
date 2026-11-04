import json
import re
import sys
import openpyxl

sys.stdout.reconfigure(encoding='utf-8')

# 1. Search in Excel file
wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

print("=== Search in Excel Combined Master List ===")
for r in range(2, ws.max_row + 1):
    chem = str(ws.cell(r, 2).value or '')
    brands = str(ws.cell(r, 3).value or '')
    if any(k in chem.lower() or k in brands.lower() for k in ['cypermethrin', 'lancer', 'tolfenpyrad']):
        print(f"Row {r} [S.No {ws.cell(r, 1).value}]: {chem} -> Brands: {brands[:100]}")

# 2. Search in agrochemicalsData.ts
print("\n=== Search in agrochemicalsData.ts ===")
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    text = f.read()

for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"(.*?)"popularBrands":\s*(\[[^\]]*\])', text, re.DOTALL):
    aid = m.group(1)
    aname = m.group(2)
    brands = m.group(4)
    if 'tolfenpyrad' in aid.lower() or 'tolfenpyrad' in aname.lower() or '45' in aid or 'lancer' in brands.lower():
        print(f"Agro ID: {aid} ({aname}) -> Brands: {brands}")

# 3. Search in cropPestData.json
print("\n=== Search in cropPestData.json ===")
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

for k, v in cp["metadata"].items():
    if 'tolfenpyrad' in k.lower() or '45' in k or any('lancer' in str(b).lower() for b in v.get('popularBrands', [])):
        print(f"Meta Key: {k} -> Brands: {v.get('popularBrands')}")
