import json
import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

from test_brand_parser import pdf_items
from exact_mapping_def import EXACT_MAPPING

pdf_dict = {p['num']: p for p in pdf_items}

# Build mapping from aid -> brands
aid_to_brands = {}
for num, (mk, aid) in EXACT_MAPPING.items():
    if aid:
        aid_to_brands[aid] = pdf_dict[num]['brands']

# Also include variant mappings if any
VARIANT_AGRO = {
    'alphacypermethrin-10-sc': 6,
    'cypermethrin-0-25-dp': 24,
    'deltamethrin-2-5-wp': 28,
    'fenvalerate-02-conc': 47,
    'imidacloprid-70-ws': 58,
    'novaluron-8-8-sc': 73,
}

for aid, num in VARIANT_AGRO.items():
    aid_to_brands[aid] = pdf_dict[num]['brands']

print(f"Total agro IDs to update: {len(aid_to_brands)}")

# Function to replace popularBrands for a given id
# In agrochemicalsData.ts, each entry looks like:
#   {
#     "id": "acephate-75-sp",
#     ...
#     "popularBrands": [
#       ...
#     ],
#     ...
#   },
updated_count = 0

def update_item_brands(content, item_id, brands):
    # Find the block for this id
    pattern = re.compile(r'(\{\s*"id":\s*"' + re.escape(item_id) + r'",.*?"popularBrands":\s*)\[[^\]]*\]', re.DOTALL)
    m = pattern.search(content)
    if not m:
        return content, False
    
    # Format new brands JSON
    brands_formatted = json.dumps(brands, indent=6, ensure_ascii=False)
    # indent properly
    brands_lines = brands_formatted.split('\n')
    indented_brands = brands_lines[0] + '\n' + '\n'.join('    ' + l for l in brands_lines[1:])
    
    new_content = content[:m.start()] + m.group(1) + indented_brands + content[m.end():]
    return new_content, True

new_agro_ts = agro_ts
for aid, brands in aid_to_brands.items():
    new_agro_ts, success = update_item_brands(new_agro_ts, aid, brands)
    if success:
        updated_count += 1
    else:
        print(f"Warning: id '{aid}' not found in agrochemicalsData.ts")

print(f"Updated {updated_count} / {len(aid_to_brands)} items in agrochemicalsData.ts")

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(new_agro_ts)

print("Saved project/src/features/agrochemicals/data/agrochemicalsData.ts successfully!")
