import json, re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

items_raw = re.findall(r'\{\s*"id":\s*"([^"]+)",(.*?)\n  \}', ts_text, re.DOTALL)
ts_items = []
for item_id, body in items_raw:
    full_str = '{\n    "id": "' + item_id + '",' + body + '\n  }'
    try:
        obj = json.loads(full_str)
        if obj.get("popularBrands"):
            ts_items.append((obj["name"], obj["popularBrands"]))
    except:
        pass

print(f"Items with popularBrands: {len(ts_items)}")
for name, brands in ts_items[:10]:
    print(f"{name:35} -> {brands}")
