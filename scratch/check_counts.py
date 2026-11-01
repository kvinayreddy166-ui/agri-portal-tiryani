import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts = f.read()

ids = re.findall(r'(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\']', ts)
cats = re.findall(r'(?:["\']?category["\']?)\s*:\s*["\']([^"\']+)["\']', ts)

print(f'Total items by ID: {len(ids)}, Unique IDs: {len(set(ids))}')
from collections import Counter
print('Category breakdown:', Counter(cats))
