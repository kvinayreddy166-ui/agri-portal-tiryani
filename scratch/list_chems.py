import openpyxl
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

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

rows = []
for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    brands = ws.cell(r, 3).value
    if chem:
        rows.append({
            "row": r,
            "sno": int(sno) if isinstance(sno, float) else sno,
            "chem": str(chem).strip(),
            "brands": str(brands).strip() if brands else ""
        })

print(f"Total rows: {len(rows)}")

# Let's see all unique chemical names in rows
for row in rows:
    print(f"[{row['sno']}] {row['chem']}")
