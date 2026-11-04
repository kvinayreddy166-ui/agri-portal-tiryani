import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'\{\s*"id":\s*"acephate-25-fenvalerate-3-ec"[^\}]*"popularBrands":\s*(\[[^\]]*\])', re.DOTALL)
m = pattern.search(text)
if m:
    print("Found acephate-25-fenvalerate-3-ec:")
    print(m.group(0))
else:
    print("Not found in agrochemicalsData.ts")
