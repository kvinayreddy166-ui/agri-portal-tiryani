import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's count categories
cats = re.findall(r"category:\s*['\"]([^'\"]+)['\"]", text)
from collections import Counter
print("Category counts:", Counter(cats))

# Let's find some ids and names
items = re.findall(r"id:\s*['\"]([^'\"]+)['\"],\s*\n\s*name:\s*['\"]([^'\"]+)['\"]", text)
print(f"Total matched items: {len(items)}")
print("First 5 items:", items[:5])
print("Last 5 items:", items[-5:])
