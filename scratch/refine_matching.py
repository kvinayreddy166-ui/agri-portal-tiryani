import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

items = []
for m in re.finditer(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'](?P<content>.*?)\n\s*\}', ts_content, re.DOTALL):
    iid = m.group(1)
    content = m.group('content')
    m_name = re.search(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    m_cat = re.search(r'(?:["\']?category["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    name = m_name.group(1) if m_name else ''
    cat = m_cat.group(1) if m_cat else ''
    items.append((iid, name, cat))

insecticides = [x for x in items if x[2] == 'insecticide']

def simplify(s):
    s = s.lower()
    # remove all non-alphanumeric
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('betacyfluthrin', 'betacyfluthrin')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    s = s.replace('ww', '').replace('wv', '').replace('mm', '')
    # remove leading zero in numbers like 02 -> 2
    s = re.sub(r'0+(\d)', r'\1', s)
    return s

ex_map = {simplify(name): (iid, name) for iid, name, cat in insecticides}

with open('scratch/all_registered_insecticides.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip().split('\t') for line in f if line.strip()]

still_missing = []
matched_count = 0

for itype, num, name in lines:
    s = simplify(name)
    if s in ex_map:
        matched_count += 1
        continue
    # try partial substring
    found = False
    for k, v in ex_map.items():
        if k == s:
            found = True
            break
    if found:
        matched_count += 1
    else:
        still_missing.append((itype, num, name))

print(f'With better simplification: Matched {matched_count}, Missing {len(still_missing)}')
print(f'Singles missing: {sum(1 for x in still_missing if x[0]=="SINGLE")}')
print(f'Combos missing: {sum(1 for x in still_missing if x[0]=="COMBO")}')

with open('scratch/genuinely_missing.txt', 'w', encoding='utf-8') as f:
    for x in still_missing:
        f.write(f'{x[0]}\t{x[1]}\t{x[2]}\n')

