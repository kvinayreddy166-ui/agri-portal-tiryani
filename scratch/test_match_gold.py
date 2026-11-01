import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

print(f"Total entries in gold standard: {len(gold_standard)}")

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

def canonical_form_key(s):
    s = s.lower().strip()
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablets', 'tab').replace('tablet', 'tab')
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    
    def norm_num(m):
        val = float(m.group(1))
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

matched = 0
unmatched = []

for m in matches:
    block = m.group(0)
    if not ('"category": "insecticide"' in block or "category: 'insecticide'" in block):
        continue
    name_m = re.search(r'["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    if not name_m:
        continue
    name = name_m.group(1)
    k = canonical_form_key(name)
    
    if k in gold_standard:
        matched += 1
    else:
        # Check partial or variations
        found = False
        for gk in gold_standard:
            if k == gk:
                found = True
                break
        if found:
            matched += 1
        else:
            unmatched.append((name, k))

print(f"Direct canonical matched insecticides: {matched} / 504")
print(f"Unmatched count: {len(unmatched)}")
if unmatched:
    print("Sample unmatched (first 25):")
    for u in unmatched[:25]:
        print("  -", u[0], "-->", u[1])
