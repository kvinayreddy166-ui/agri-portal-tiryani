import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_extracted_tables.json', 'r', encoding='utf-8') as f:
    cibrc_data = json.load(f)

print(f'Total tables extracted: {len(cibrc_data)}')

with open('scratch/genuinely_missing_v2.txt', 'r', encoding='utf-8') as f:
    missing = [l.strip().split('\t') for l in f if l.strip()]

def norm_s(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'0+(\d)', r'\1', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    return s

matched_missing = 0
unmatched_missing = []

for itype, num, name in missing:
    ns = norm_s(name)
    found = None
    if ns in cibrc_data:
        found = cibrc_data[ns]
    else:
        for k, v in cibrc_data.items():
            if k == ns or (len(k) > 10 and (k in ns or ns in k)):
                found = v
                break
    if found and (found['crops'] or found['pests']):
        matched_missing += 1
    else:
        unmatched_missing.append((itype, num, name))

print(f'Missing items: {len(missing)}')
print(f'Matched with extracted tables: {matched_missing}')
print(f'Remaining unmatched: {len(unmatched_missing)}')

print('\nFirst 20 Unmatched Missing items:')
for m in unmatched_missing[:20]:
    print(f'  {m[0]} {m[1]}: {m[2]}')
