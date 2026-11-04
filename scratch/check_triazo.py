import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    s = f.read()

for m in re.finditer(r'"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', s):
    i, n = m.group(1), m.group(2)
    if 'triazo' in i.lower() or 'triazo' in n.lower():
        print(i, '->', n)
