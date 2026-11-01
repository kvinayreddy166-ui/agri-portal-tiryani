import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']emamectin-5-lufenuron-40-wg["\'].*?\n\s*\}', text, re.DOTALL)
if m:
    print(m.group(0))
else:
    print("Not found")
