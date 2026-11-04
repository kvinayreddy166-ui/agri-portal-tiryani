import json
from collections import Counter

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

print(f"Total rows: {len(rows)}")

ins_counts = Counter(r["insecticide"] for r in rows)
print(f"Total unique insecticides: {len(ins_counts)}")

for ins, count in ins_counts.most_common():
    print(f"{ins:45} : {count:3} uses")
