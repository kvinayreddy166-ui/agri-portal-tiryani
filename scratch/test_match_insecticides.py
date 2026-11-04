import json, re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Array starts after "= ["
start_idx = text.find('= [') + 2
end_idx = text.rfind('];')
json_str = text[start_idx:end_idx].strip()

items = json.loads(json_str)
print(f"Loaded {len(items)} items from agrochemicalsData.ts successfully!")

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

unique_pdf_insecticides = sorted(list(set(r["insecticide"] for r in rows)))
print(f"Unique insecticides in PDF: {len(unique_pdf_insecticides)}")

def normalize_name(s):
    s = s.lower().replace('–', '-').replace('—', '-')
    s = re.sub(r'[\s/]+', ' ', s).strip()
    s = re.sub(r'(\d+)\s*%', r'\1%', s)
    s = s.replace('% w/w', '').replace('w/w', '').replace('m/m', '').replace('min.', '').replace('min', '')
    s = s.replace('d.p.', 'dp').replace('w.p.', 'wp').replace('c.g.', 'cg').replace('g.r.', 'gr')
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('imidaclopride', 'imidacloprid')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

ts_map = {}
for it in items:
    norm = normalize_name(it["name"])
    ts_map[norm] = it
    ts_map[norm.replace('%', '')] = it
    # also base active name
    base_active = re.sub(r'[\d\.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', norm).strip()
    if base_active and len(base_active) > 3:
        if base_active not in ts_map:
            ts_map[base_active] = it

matched = []
unmatched = []

for ins in unique_pdf_insecticides:
    norm_ins = normalize_name(ins)
    norm_ins_no_pct = norm_ins.replace('%', '')
    
    found = None
    if norm_ins in ts_map:
        found = ts_map[norm_ins]
    elif norm_ins_no_pct in ts_map:
        found = ts_map[norm_ins_no_pct]
    else:
        base_ins = re.sub(r'[\d\.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', norm_ins).strip()
        if base_ins in ts_map:
            found = ts_map[base_ins]
        else:
            for k, it in ts_map.items():
                if k == norm_ins or (len(k) > 5 and (k in norm_ins or norm_ins in k)):
                    found = it
                    break
    
    if found:
        matched.append((ins, found["name"], found.get("moaGroup", ""), found.get("popularBrands", [])))
    else:
        unmatched.append(ins)

print(f"Matched: {len(matched)} / {len(unique_pdf_insecticides)}")
print(f"Unmatched count: {len(unmatched)}")
if unmatched:
    print("Unmatched list:", unmatched)
