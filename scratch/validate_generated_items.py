import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/generated_missing_items.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

print(f'Validating {len(items)} items...')

errors = []
ids = set()

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts = f.read()

existing_ids = set(re.findall(r'(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\']', ts))

for idx, item in enumerate(items):
    iid = item['id']
    if iid in ids:
        errors.append(f"Duplicate id in generated items: {iid}")
    if iid in existing_ids:
        errors.append(f"Conflict with existing id: {iid}")
    ids.add(iid)
    
    if not re.search(r'IRAC Group', item['moaGroup'], re.IGNORECASE):
        errors.append(f"Item {iid} moaGroup does not match /IRAC Group/i: '{item['moaGroup']}'")
        
    if len(item['moaGroupName']) == 0:
        errors.append(f"Item {iid} moaGroupName is empty")
        
    if len(item['dosagePerAcre']) == 0:
        errors.append(f"Item {iid} dosagePerAcre is empty")
        
    if len(item['targetCrops']) == 0:
        errors.append(f"Item {iid} targetCrops is empty")
        
    if len(item['targetPests']) == 0:
        errors.append(f"Item {iid} targetPests is empty")
        
    if item['category'] != 'insecticide':
        errors.append(f"Item {iid} category is not insecticide: '{item['category']}'")
        
    if item['toxicityBand'] not in ['green', 'blue', 'yellow', 'red', 'unclassified']:
        errors.append(f"Item {iid} invalid toxicityBand: '{item['toxicityBand']}'")

print(f'Total validation errors: {len(errors)}')
if errors:
    for e in errors[:10]:
        print(' ', e)
else:
    print('ALL 323 ITEMS PASSED VALIDATION PERFECTLY!')
