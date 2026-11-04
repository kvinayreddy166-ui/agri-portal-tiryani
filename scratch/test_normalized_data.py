import json

with open('project/src/features/agrochemicals/data/cropPestInsecticidesData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Load all 732 entries
start = text.find('= [') + 2
end = text.rfind('];')
entries = json.loads(text[start:end])
print(f"Total entries: {len(entries)}")

# Extract unique insecticide metadata
metadata_map = {}
compact_rows = []

for idx, e in enumerate(entries):
    ins_name = e["insecticide"]
    meta_key = ins_name.lower().replace(' ', '-').replace('%', '').replace('/', '-')
    
    if meta_key not in metadata_map:
        metadata_map[meta_key] = {
            "insecticide": ins_name,
            "insecticideTe": e["insecticideTe"],
            "chemicalId": e.get("chemicalId"),
            "chemicalFamily": e["chemicalFamily"],
            "chemicalFamilyTe": e["chemicalFamilyTe"],
            "iracGroup": e["iracGroup"],
            "moaGroupName": e["moaGroupName"],
            "moaDescription": e["moaDescription"],
            "moaDescriptionTe": e["moaDescriptionTe"],
            "popularBrands": e["popularBrands"],
            "toxicityBand": e["toxicityBand"],
            "toxicityLabel": e["toxicityLabel"],
            "toxicityLabelTe": e["toxicityLabelTe"],
            "waitingPeriodDays": e["waitingPeriodDays"],
            "sprayPrecautions": e.get("sprayPrecautions", ""),
            "sprayPrecautionsTe": e.get("sprayPrecautionsTe", ""),
            "antidoteInfo": e.get("antidoteInfo", ""),
            "antidoteInfoTe": e.get("antidoteInfoTe", "")
        }
        
    compact_rows.append({
        "id": e["id"],
        "c": e["crop"],
        "ct": e["cropTe"],
        "p": e["pest"],
        "pt": e["pestTe"],
        "mk": meta_key,
        "ai": e["aiDosePerHa"],
        "fd": e["formulationDosePerHa"],
        "sf": e["sprayFluidPerHa"],
        "da": e["calculatedDosePerAcre"],
        "dp": e["calculatedDosePerPump"],
        "pg": e["cibrcPage"]
    })

print(f"Unique insecticide meta entries: {len(metadata_map)}")
print(f"Compact rows: {len(compact_rows)}")

# Size comparison
meta_json = json.dumps(metadata_map, ensure_ascii=False)
rows_json = json.dumps(compact_rows, ensure_ascii=False)
total_bytes = len(meta_json.encode('utf-8')) + len(rows_json.encode('utf-8'))
print(f"Total normalized size: {total_bytes / 1024:.1f} KB (down from 1200 KB!)")
