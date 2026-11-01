import json
import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

for item in items:
    if item['id'] == 'malathion-50-ec':
        print("NAME:", repr(item.get('name')))
        print("UPPER:", repr(item.get('name', '').upper()))
        tokens = [' GR', ' % GR', 'CG', ' DP', ' DUST']
        for t in tokens:
            if t in item.get('name', '').upper():
                print("Matched token:", t)
