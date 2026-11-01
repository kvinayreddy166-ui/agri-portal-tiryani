import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for term in ['zinc', 'phosphide', 'warfarin', 'coumatetralyl', 'bromadiolone', 'aluminium phosphide']:
    matches = re.findall(rf'["\']?name["\']?\s*:\s*[\'"][^\'"]*{term}[^\'"]*[\'"]', text, re.IGNORECASE)
    print(f"Term '{term}': {matches}")
