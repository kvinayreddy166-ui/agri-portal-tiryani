import json
import re
import sys
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

c = Counter([item.get('dosagePerLitre', '') for item in items])
print(f"Total items: {len(items)}")
for k, v in c.most_common(15):
    print(f"  {v}x: '{k}'")
