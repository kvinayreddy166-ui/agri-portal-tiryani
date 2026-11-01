import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts = f.read()

names = set(re.findall(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', ts))

def norm(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'0+(\d)', r'\1', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    return s

db_norm = {norm(n): n for n in names}

with open('scratch/all_registered_insecticides.txt', 'r', encoding='utf-8') as f:
    all_regs = [l.strip().split('\t') for l in f if l.strip()]

matched = 0
unmatched = []

for itype, num, name in all_regs:
    ns = norm(name)
    found = False
    if ns in db_norm:
        found = True
    else:
        for k in db_norm:
            if k == ns or (len(k) > 10 and (k in ns or ns in k)):
                found = True
                break
    if found:
        matched += 1
    else:
        unmatched.append((itype, num, name))

print(f'Total register items in PDF: {len(all_regs)}')
print(f'Matched in AGRONIX database: {matched}')
print(f'Unmatched: {len(unmatched)}')

if unmatched:
    for u in unmatched:
        print('  Missing:', u)
else:
    print('100% OF ALL INSECTICIDE FORMULATIONS (1 to 295 and 684 to 879) ARE PRESENT IN AGRONIX DATABASE!')
