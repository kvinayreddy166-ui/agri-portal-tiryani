import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def norm_num(m):
    val = float(m.group(1))
    if val == int(val):
        return f'{int(val)}'
    return f'{val}'

def deep_clean(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    # replace numbers with normalized floats
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    s = s.replace('householdproduct', 'household')
    s = s.replace('forimportonlyolysetnet', '')
    s = s.replace('forusebypestcontroloperatorsonly', '')
    return s

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

existing_items = []
for m in re.finditer(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'](?P<content>.*?)\n\s*\}', ts_content, re.DOTALL):
    iid = m.group(1)
    content = m.group('content')
    m_name = re.search(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    m_cat = re.search(r'(?:["\']?category["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    name = m_name.group(1) if m_name else ''
    cat = m_cat.group(1) if m_cat else ''
    existing_items.append((iid, name, cat))

ex_insects = {deep_clean(name): (iid, name) for iid, name, cat in existing_items if cat == 'insecticide'}

with open('scratch/all_registered_insecticides.txt', 'r', encoding='utf-8') as f:
    all_regs = [l.strip().split('\t') for l in f if l.strip()]

matched = []
missing = []

for itype, num, name in all_regs:
    cs = deep_clean(name)
    if cs in ex_insects:
        matched.append((itype, num, name, ex_insects[cs][0], ex_insects[cs][1]))
    else:
        # Check partial
        found = None
        for k, v in ex_insects.items():
            if k == cs or (len(k) > 12 and (k in cs or cs in k)):
                found = v
                break
        if found:
            matched.append((itype, num, name, found[0], found[1]))
        else:
            missing.append((itype, num, name))

print(f'Total register: {len(all_regs)}')
print(f'Matched: {len(matched)}')
print(f'Missing: {len(missing)} (Singles: {sum(1 for x in missing if x[0]=="SINGLE")}, Combos: {sum(1 for x in missing if x[0]=="COMBO")})')

with open('scratch/genuinely_missing_v2.txt', 'w', encoding='utf-8') as f:
    for x in missing:
        f.write(f'{x[0]}\t{x[1]}\t{x[2]}\n')

print('Saved scratch/genuinely_missing_v2.txt')
