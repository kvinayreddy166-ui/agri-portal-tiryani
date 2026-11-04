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

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

rows = []
for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    brands = ws.cell(r, 3).value
    if chem:
        rows.append((r, int(sno) if isinstance(sno, float) else sno, chem.strip(), str(brands).strip() if brands else ""))

# Let's inspect rows 51 to 160
with open("scratch/all_rows_list.txt", "w", encoding="utf-8") as out:
    for r, sno, chem, brands in rows:
        out.write(f"Row {r} [S.No {sno}]: {chem}\n")

print(f"Wrote {len(rows)} rows to scratch/all_rows_list.txt")
