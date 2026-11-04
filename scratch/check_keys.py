import json

with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    crop_pest = json.load(f)

print("Top-level keys in cropPestData.json:", list(crop_pest.keys()))
