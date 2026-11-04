import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    text = f.read()

# Let's check how popularBrands is defined in the items
matches = list(re.finditer(r'"popularBrands":\s*(\[[^\]]*\])', text))
print(f"Total popularBrands fields found in agrochemicalsData.ts: {len(matches)}")
for m in matches[:3]:
    print(m.group(0)[:100])
