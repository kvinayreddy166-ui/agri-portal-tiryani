import json
from collections import Counter

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

pests = Counter(r["pest"] for r in rows)
print(f"Total unique pest strings: {len(pests)}")
for p, c in pests.most_common(25):
    print(f"{p:40} : {c:3} uses")
