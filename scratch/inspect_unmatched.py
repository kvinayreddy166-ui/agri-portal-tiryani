import json
import re
import sys
import difflib

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

def canonical_form_key(s):
    s = s.lower().strip()
    s = s.replace('allerthrin', 'allethrin')
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

all_gold_keys = list(gold_standard.keys())

unmatched_info = []

for m in matches:
    block = m.group(0)
    if not ('"category": "insecticide"' in block or "category: 'insecticide'" in block):
        continue
    name_m = re.search(r'["\']?name["\']?\s*:\s*[\'"]([^\'"]+)[\'"]', block)
    if not name_m:
        continue
    name = name_m.group(1)
    k = canonical_form_key(name)
    
    if k not in gold_standard:
        # find closest in gold standard
        close = difflib.get_close_matches(k, all_gold_keys, n=3, cutoff=0.6)
        close_titles = [gold_standard[ck]['raw_title'] for ck in close]
        unmatched_info.append((name, k, close_titles))

print(f"Total unmatched: {len(unmatched_info)}")
for name, k, close in unmatched_info:
    print(f"DB: '{name}' (key: {k}) -> Closest: {close}")
