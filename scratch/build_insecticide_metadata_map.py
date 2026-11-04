import re
import json

# 1. Read existing TS file to extract existing definitions
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

# Pattern to extract items
# Each item starts with { "id": "...", ... }
items_raw = re.findall(r'\{\s*"id":\s*"([^"]+)",(.*?)\n  \}', ts_text, re.DOTALL)
print(f"Extracted {len(items_raw)} items from AGROCHEMICALS_DATA using regex")

existing_db = {}
for item_id, body in items_raw:
    full_str = '{\n    "id": "' + item_id + '",' + body + '\n  }'
    try:
        obj = json.loads(full_str)
        # normalize name key
        name = obj.get("name", "")
        existing_db[name.lower().strip()] = obj
        # also active ingredient base
        base = re.sub(r'[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', name.lower()).strip()
        if base and base not in existing_db:
            existing_db[base] = obj
    except Exception as e:
        pass

print(f"Parsed {len(existing_db)} keys in existing_db")

# Read unique insecticides from PDF
with open('scratch/unique_pdf_insecticides.txt', 'r', encoding='utf-8') as f:
    pdf_insects = [line.strip() for line in f if line.strip()]

print(f"Total unique PDF insecticides: {len(pdf_insects)}")

# Check matches
found_count = 0
not_found = []
for ins in pdf_insects:
    norm = ins.lower().strip()
    norm_no_pct = norm.replace('%', '')
    base = re.sub(r'[\d.\s%]+(?:ec|sc|sp|gr|cg|wp|dp|fs|ws|wg|wdg|sl|cs|od|af|gel|dc|conc|tablet).*$', '', norm).strip()
    
    match = None
    if norm in existing_db:
        match = existing_db[norm]
    elif norm_no_pct in existing_db:
        match = existing_db[norm_no_pct]
    elif base in existing_db:
        match = existing_db[base]
    else:
        # substring search
        for k, v in existing_db.items():
            if base and base in k:
                match = v
                break
                
    if match:
        found_count += 1
    else:
        not_found.append(ins)

print(f"Direct/Base matched from existing_db: {found_count} / {len(pdf_insects)}")
print(f"Not found in existing_db ({len(not_found)}): {not_found}")
