import json
import re

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

merged_rows = []
skip_indices = set()

for i in range(len(rows)):
    if i in skip_indices:
        continue
    r = rows[i]
    
    # Check if next row is a cross-page split continuation
    if i + 1 < len(rows):
        next_r = rows[i+1]
        
        # Case A: Row 50-51 (Bhendi Azadirachtin: 'Pod' + 'Borer')
        if r["insecticide"] == next_r["insecticide"] and r["crop"] == next_r["crop"]:
            if r["pest"].endswith("Pod") and next_r["pest"] == "Borer" and not next_r["formulationDose"]:
                r["pest"] = r["pest"] + " borer"
                skip_indices.add(i+1)
            elif not next_r["pest"] and next_r["formulationDose"]:
                # Case B: Row 397-398 (Mango Deltamethrin: '0.33 to' + '0.5ml/lit')
                r["formulationDose"] = f"{r['formulationDose']} {next_r['formulationDose']}".strip()
                r["sprayFluid"] = f"{r['sprayFluid']} {next_r['sprayFluid']}".strip()
                skip_indices.add(i+1)
                
    # If pest is empty for any reason, skip or fallback
    if not r["pest"].strip():
        continue
        
    merged_rows.append(r)

print(f"Original rows: {len(rows)}, Clean merged rows: {len(merged_rows)}")

# Verify all rows have non-empty crop, pest, insecticide
for idx, r in enumerate(merged_rows):
    assert len(r["crop"]) > 0, f"Row {idx} has empty crop"
    assert len(r["pest"]) > 0, f"Row {idx} has empty pest"
    assert len(r["insecticide"]) > 0, f"Row {idx} has empty insecticide"

print("All merged rows verified! Non-empty crop, pest, insecticide for 100% of rows.")

with open('scratch/extracted_crop_pest_insecticides.json', 'w', encoding='utf-8') as f:
    json.dump(merged_rows, f, indent=2, ensure_ascii=False)
