import json
import re

# Load cropPestData.json
with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

from test_brand_parser import pdf_items
from exact_mapping_def import EXACT_MAPPING

pdf_dict = {p['num']: p for p in pdf_items}

# Track updates
meta_updated = {}

for num, (mk, aid) in EXACT_MAPPING.items():
    if mk and mk in meta:
        brands = pdf_dict[num]['brands']
        meta[mk]['popularBrands'] = brands
        meta_updated[mk] = (num, pdf_dict[num]['technical'], len(brands))

# Also update related formulation variants in metadata that share the active molecule
VARIANT_MAPPINGS = {
    'alphacypermethrin-10-sc': 6, # Alphamethrin 10% EC
    'carbaryl-10-d-p': 10, # Carbaryl
    'carbaryl-4-g-r': 10,
    'carbaryl-5-d-p': 10,
    'carbaryl-85-w-p': 10,
    'carbosulfan-25-ds': 12, # Carbosulfan
    'carbosulfan-6-g': 12,
    'cartap-hydrochloride-75-sg': 14, # Cartap
    'cypermethrin-0-25-dp': 24, # Cypermethrin
    'deltamethrin-1-8-ec': 28, # Deltamethrin
    'deltamethrin-2-5-wp': 28,
    'deltamethrin-25-tablet': 28,
    'emamectin-benzoate-1-9-ec': 36, # Emamectin Benzoate
    'fenvalerate-2-conc': 47, # Fenvalerate
    'imidacloprid-0-3-gr': 55, # Imidacloprid
    'imidacloprid-70-ws-per-100-kg-seed': 58, # Imidacloprid 70% WS
    'indoxacarb-15-8-ec': 59, # Indoxacarb
    'monocrotophos-15-sg': 71, # Monocrotophos
    'novaluron-8-8-sc': 73, # Novaluron
    'phenthoate-2-dp': 75, # Phenthoate
    'quinalphos-20-af': 82, # Quinalphos
    'quinalphos-25-gel': 82,
    'quinalphos-5-g': 82,
}

for vmk, num in VARIANT_MAPPINGS.items():
    if vmk in meta:
        brands = pdf_dict[num]['brands']
        meta[vmk]['popularBrands'] = brands
        meta_updated[vmk] = (num, pdf_dict[num]['technical'] + ' (variant)', len(brands))

print(f"Total metadata items updated with PDF brands: {len(meta_updated)} / {len(meta)}")

# Save updated cropPestData.json
with open('project/src/features/agrochemicals/data/cropPestData.json', 'w', encoding='utf-8') as f:
    json.dump(cp, f, indent=2, ensure_ascii=False)

print("Saved project/src/features/agrochemicals/data/cropPestData.json successfully!")
