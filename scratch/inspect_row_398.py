import json

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

for idx in [395, 396, 397, 398, 399]:
    if idx < len(rows):
        print(f"Row {idx+1}: {rows[idx]}")
