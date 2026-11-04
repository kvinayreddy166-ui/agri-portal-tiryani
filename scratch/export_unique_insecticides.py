import json, re

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

unique_insecticides = sorted(list(set(r["insecticide"] for r in rows)))
print(f"Total unique insecticides: {len(unique_insecticides)}")

with open('scratch/unique_pdf_insecticides.txt', 'w', encoding='utf-8') as f:
    for ins in unique_insecticides:
        f.write(ins + '\n')

print("Wrote scratch/unique_pdf_insecticides.txt")
