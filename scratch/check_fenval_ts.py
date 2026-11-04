import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'\{\s*"id":\s*"fenvalerate-20-ec"[^\}]*"popularBrands":\s*(\[[^\]]*\])', re.DOTALL)
m = pattern.search(text)
if m:
    print(m.group(0))
