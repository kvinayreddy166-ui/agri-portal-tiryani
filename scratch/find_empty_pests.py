import json

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

for idx, r in enumerate(rows):
    if not r["pest"].strip():
        print(f"Row {idx+1}: Page {r['page']}, Crop: '{r['crop']}', Ins: '{r['insecticide']}', Pest: '{r['pest']}'")
