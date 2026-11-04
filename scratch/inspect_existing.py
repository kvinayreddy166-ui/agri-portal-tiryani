import json

with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    d = json.load(f)

print("Total metadata keys in cropPestData.json:", len(d["metadata"]))
sample_keys = list(d["metadata"].keys())[:5]
for k in sample_keys:
    print(k, ":", d["metadata"][k].get("popularBrands"))
