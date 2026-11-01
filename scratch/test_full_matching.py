import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load CIB-RC Gold Standard
with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

print(f"Loaded Gold Standard: {len(gold_standard)} formulations.")

# Let's inspect how many keys match directly or through normalization
def norm_key(s):
    s = s.lower().strip()
    s = s.replace('spinoteram', 'spinetoram')
    s = s.replace('buprofenzin', 'buprofezin')
    s = s.replace('spiropidion', 'spiropidon')
    s = s.replace('pyrifluquinazon', 'pyrifluinazon')
    s = s.replace('allerthrin', 'allethrin')
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablets', 'tab').replace('tablet', 'tab')
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'\(.*?\)', '', s)
    
    def norm_num(m):
        val = float(m.group(1))
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

# Read agrochemicalsData.ts
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

print(f"Total items parsed from TS: {len(matches)}")
insecticides = []
non_insecticides = []

for m in matches:
    block = m.group(0)
    name_m = re.search(r'["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    id_m = re.search(r'["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    cat_m = re.search(r'["\']?category["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    
    item = {
        'id': id_m.group(1) if id_m else '',
        'name': name_m.group(1) if name_m else '',
        'category': cat_m.group(1) if cat_m else '',
        'raw_block': block
    }
    if item['category'] == 'insecticide':
        insecticides.append(item)
    else:
        non_insecticides.append(item)

print(f"Insecticides: {len(insecticides)}, Non-insecticides: {len(non_insecticides)}")

matched_count = 0
unmatched_items = []

for it in insecticides:
    k = norm_key(it['name'])
    claims = []
    pages = []
    
    # Check direct
    if k in gold_standard:
        claims = gold_standard[k]['claims']
        pages = gold_standard[k]['pages']
    else:
        # Check sub-parts if '/' in name
        if '/' in it['name']:
            parts = [p.strip() for p in it['name'].split('/')]
            base_name = re.sub(r'[\d\.%]+\s*[a-zA-Z]+.*', '', it['name']).strip()
            for p in parts:
                cand = p if base_name.lower() in p.lower() else f"{base_name} {p}"
                pk = norm_key(cand)
                if pk in gold_standard:
                    claims.extend(gold_standard[pk]['claims'])
                    pages.extend(gold_standard[pk]['pages'])
    
    if claims:
        matched_count += 1
    else:
        unmatched_items.append(it)

print(f"Direct/Composite CIB-RC claims matched: {matched_count} / {len(insecticides)}")
print(f"Remaining without major agricultural use claims in Doc 1: {len(unmatched_items)}")
