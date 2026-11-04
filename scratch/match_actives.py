import json, re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

# Load all 520 items
items_raw = re.findall(r'\{\s*"id":\s*"([^"]+)",(.*?)\n  \}', ts_text, re.DOTALL)
ts_items = []
for item_id, body in items_raw:
    full_str = '{\n    "id": "' + item_id + '",' + body + '\n  }'
    try:
        obj = json.loads(full_str)
        ts_items.append(obj)
    except:
        pass

print(f"Loaded {len(ts_items)} items from TS.")

# Index by various keys
active_to_item = {}
for it in ts_items:
    name = it["name"].lower()
    # Remove numbers and formulations
    active = re.sub(r'[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', name).strip()
    active_clean = re.sub(r'[^a-z]', '', active)
    if active_clean and active_clean not in active_to_item:
        active_to_item[active_clean] = it
    # also exact name clean
    name_clean = re.sub(r'[^a-z0-9]', '', name)
    active_to_item[name_clean] = it

with open('scratch/unique_pdf_insecticides.txt', 'r', encoding='utf-8') as f:
    pdf_insects = [line.strip() for line in f if line.strip()]

matched = 0
unmatched_actives = set()
for ins in pdf_insects:
    ins_lower = ins.lower()
    ins_clean = re.sub(r'[^a-z0-9]', '', ins_lower)
    active = re.sub(r'[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', ins_lower).strip()
    active_clean = re.sub(r'[^a-z]', '', active)
    
    found = None
    if ins_clean in active_to_item:
        found = active_to_item[ins_clean]
    elif active_clean in active_to_item:
        found = active_to_item[active_clean]
    else:
        for k, it in active_to_item.items():
            if active_clean and len(active_clean) > 4 and (active_clean in k or k in active_clean):
                found = it
                break
                
    if found:
        matched += 1
    else:
        unmatched_actives.add(active if active else ins)

print(f"Matched: {matched} / {len(pdf_insects)}")
print(f"Unmatched unique actives ({len(unmatched_actives)}): {sorted(list(unmatched_actives))}")
