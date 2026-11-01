import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Split into individual item blocks: look for '{ id:' or '{ "id":'
# Or parse using regex for each object
item_blocks = re.findall(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'].*?\n\s*\}', ts_content, re.DOTALL)
print(f'Total items by ID: {len(item_blocks)}')

# Let's extract (id, name, category) for all
items = []
for m in re.finditer(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'](?P<content>.*?)\n\s*\}', ts_content, re.DOTALL):
    iid = m.group(1)
    content = m.group('content')
    m_name = re.search(r'(?:["\']?name["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    m_cat = re.search(r'(?:["\']?category["\']?)\s*:\s*["\']([^"\']+)["\']', content)
    name = m_name.group(1) if m_name else ''
    cat = m_cat.group(1) if m_cat else ''
    items.append((iid, name, cat))

print(f'Parsed {len(items)} items. Categories: {set(x[2] for x in items)}')
insecticides = [x for x in items if x[2] == 'insecticide']
print(f'Existing insecticides: {len(insecticides)}')

def norm(text):
    text = text.lower()
    text = re.sub(r'[\s\-_/,\(\)\+]+', '', text)
    text = text.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%').replace('%', '')
    text = text.replace('chlorpyriphos', 'chlorpyrifos')
    text = text.replace('lambdacyhalothrin', 'lambdacyhalothrin')
    text = text.replace('alphacypermethrin', 'alphacypermethrin')
    text = text.replace('betacyfluthrin', 'betacyfluthrin')
    text = text.replace('allerthrin', 'allethrin')
    text = re.sub(r'0+(\d)', r'\1', text)
    return text

existing_norm = {}
for item_id, name, cat in insecticides:
    existing_norm[norm(name)] = (item_id, name)

with open('scratch/all_registered_insecticides.txt', 'r', encoding='utf-8') as f:
    lines = [line.strip().split('\t') for line in f if line.strip()]

matched = []
missing = []

for line in lines:
    itype, num, name = line[0], line[1], line[2]
    nname = norm(name)
    found = None
    if nname in existing_norm:
        found = existing_norm[nname]
    else:
        for k, v in existing_norm.items():
            if k == nname:
                found = v
                break
    if found:
        matched.append((itype, num, name, found[0], found[1]))
    else:
        missing.append((itype, num, name))

print(f'Matched: {len(matched)}')
print(f'Missing: {len(missing)} (Singles missing: {sum(1 for m in missing if m[0]=="SINGLE")}, Combos missing: {sum(1 for m in missing if m[0]=="COMBO")})')

with open('scratch/missing_insecticides.txt', 'w', encoding='utf-8') as f:
    for m in missing:
        f.write(f'{m[0]}\t{m[1]}\t{m[2]}\n')

print('Saved scratch/missing_insecticides.txt')

print('\nFirst 20 Missing Singles:')
for m in [x for x in missing if x[0] == 'SINGLE'][:20]:
    print(f'  {m[1]}: {m[2]}')

print('\nFirst 20 Missing Combos:')
for m in [x for x in missing if x[0] == 'COMBO'][:20]:
    print(f'  {m[1]}: {m[2]}')
