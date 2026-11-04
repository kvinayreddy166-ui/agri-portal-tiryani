import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

names = re.findall(r"name:\s*'([^']+)'", text)
print(f"Total names in agrochemicalsData: {len(names)}")
no_pct = [n for n in names if any(c.isdigit() for c in n) and '%' not in n]
print(f"Names with digits but no %: {len(no_pct)}")
for n in no_pct:
    print(" ", n)
