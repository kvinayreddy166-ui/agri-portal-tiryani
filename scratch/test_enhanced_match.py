import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

def clean_text_for_key(s):
    s = s.lower().strip()
    # Typos & synonyms
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
    
    # Remove parentheticals
    s = re.sub(r'\(.*?\)', '', s)
    
    def norm_num(m):
        val = float(m.group(1))
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

# Create a normalized index for gold standard
gold_lookup = {}
for k, v in gold_standard.items():
    raw = v['raw_title']
    ck = clean_text_for_key(raw)
    gold_lookup[ck] = k
    # Also add original k
    gold_lookup[k] = k

print(f"Total entries in gold lookup: {len(gold_lookup)}")

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'\{\s*["\']?id["\']?\s*:\s*[\'"]([^\'"]+)[\'"](.*?)\n\s*\},', re.DOTALL)
matches = list(pattern.finditer(content))

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
    
    # Try whole name
    ck = clean_text_for_key(name)
    if ck in gold_lookup:
        matched += 1
        continue
        
    # If contains slash, try sub-parts
    if '/' in name:
        parts = [p.strip() for p in name.split('/')]
        # e.g. Malathion 50% EC / 5% DP -> Malathion 50% EC, Malathion 5% DP
        base_name = re.sub(r'[\d\.%]+\s*[a-zA-Z]+.*', '', name).strip()
        found_sub = False
        for p in parts:
            cand = p if base_name.lower() in p.lower() else f"{base_name} {p}"
            if clean_text_for_key(cand) in gold_lookup:
                found_sub = True
                break
        if found_sub:
            matched += 1
            continue

    unmatched.append(name)

print(f"Matched with enhanced cleaner: {matched} / 504")
print(f"Remaining unmatched: {len(unmatched)}")
print("Sample remaining unmatched (first 30):")
for u in unmatched[:30]:
    print("  -", u)
