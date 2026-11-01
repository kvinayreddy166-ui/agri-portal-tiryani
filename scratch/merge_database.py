import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read existing file
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    existing_ts = f.read()

# Load newly generated 323 items
with open('scratch/generated_missing_items.json', 'r', encoding='utf-8') as f:
    new_items = json.load(f)

print(f'New items to insert: {len(new_items)}')

# In existing_ts, find the boundary between insecticides and fungicides
# Look for "// FUNGICIDES" or "// =========================================================================\n  // FUNGICIDES"
fungicide_pos = existing_ts.find('// FUNGICIDES')
if fungicide_pos == -1:
    fungicide_pos = existing_ts.find('// =========================================================================\n  // FUNGICIDES')

if fungicide_pos == -1:
    print('Error: Could not find FUNGICIDES marker')
    sys.exit(1)

print(f'Found FUNGICIDES marker at index {fungicide_pos}')

# Prepare formatted TypeScript code for new_items
new_items_ts = '\n    // --- ADDITIONAL CIB-RC REGISTERED INSECTICIDE FORMULATIONS (1 to 295 & 684 to 879) ---\n'
for item in new_items:
    new_items_ts += '    {\n'
    for k, v in item.items():
        val_str = json.dumps(v, ensure_ascii=False)
        new_items_ts += f'      "{k}": {val_str},\n'
    new_items_ts = new_items_ts.rstrip(',\n') + '\n    },\n'

# Find the last comma before fungicide_pos
last_comma = existing_ts.rfind(',', 0, fungicide_pos)
part1 = existing_ts[:last_comma + 1]
part2 = existing_ts[fungicide_pos:]

updated_ts = part1 + '\n' + new_items_ts + '  ' + part2

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(updated_ts)

print(f'Successfully updated agrochemicalsData.ts! Total file size: {len(updated_ts)} bytes.')
