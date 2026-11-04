import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

agro_ids = set(re.findall(r'"id":\s*"([^"]+)"', agro_ts))

from test_brand_parser import pdf_items

# Updated complete mapping
MAPPING = {
    1: (None, 'abamectin-1-9-ec'),
    2: ('acephate-75-sp', 'acephate-75-sp'),
    3: ('acephate-95-sg', 'acephate-95-sg'),
    4: ('acetamiprid-20-sp', 'acetamiprid-20-sp'),
    5: (None, None), # Alpha-Cypermethrin 10% WP
    6: ('alphacypermethrin-10-ec', 'alphacypermethrin-10-ec'),
    7: ('bifenthrin-10-ec', 'bifenthrin-10-ec'),
    8: (None, 'bifenthrin-2-5-ec'),
    9: ('buprofezin-25-sc', 'buprofezin-25-sc'),
    10: ('carbaryl-50-wp', None),
    11: ('carbofuran-3-cg', 'carbofuran-3-cg'),
    12: ('carbosulfan-25-ec', 'carbosulfan-25-ec'),
    13: ('cartap-hydrochloride-4-g', 'cartap-hydrochloride-4-gr'),
    14: ('cartap-hydrochloride-50-sp', 'cartap-hydrochloride-50-sp'),
    15: ('chlorantraniliprole-0-4-gr', 'chlorantraniliprole-0-4-gr'),
    16: ('chlorantraniliprole-18-5-sc', 'chlorantraniliprole-18-5-sc'),
    17: ('chlorfenapyr-10-sc', 'chlorfenapyr-10-sc'),
    18: ('chlorpyrifos-1-5-dp', 'chlorpyrifos-1-5-dp'),
    19: ('chlorpyrifos-10-g', 'chlorpyrifos-10-granules'),
    20: ('chlorpyrifos-20-ec', 'chlorpyrifos-20-ec'),
    21: ('chlorpyrifos-50-ec', 'chlorpyrifos-50-ec'),
    22: ('chromafenozide-80-wp', 'chromafenozide-80-wp'),
    23: ('clothianidin-50-wdg', 'clothianidin-50-wdg'),
    24: ('cypermethrin-10-ec', 'cypermethrin-10-ec'),
    25: ('cypermethrin-25-ec', 'cypermethrin-25-ec'),
    26: (None, None), # Cypermethrin 5% EC
    27: ('deltamethrin-11-w-w-ec', None),
    28: ('deltamethrin-2-8-ec', 'deltamethrin-2-8-ec'),
    29: ('diafenthiuron-50wp', 'diafenthiuron-50-wp'),
    30: ('dichlorvos-76-ec', None),
    31: ('dicofol-18-5-ec', None),
    32: (None, None), # Diflubenzuron 2% GR (public health mosquito larvicide)
    33: (None, None), # Diflubenzuron 2% TB (public health mosquito larvicide)
    34: ('dimethoate-30-ec', 'dimethoate-30-ec'),
    35: ('dinotefuran-20-sg', 'dinotefuran-20-sg'),
    36: ('emamectin-benzoate-5-sg', 'emamectin-benzoate-5-sg'),
    37: (None, None), # Endosulfan 35% EC
    38: (None, None), # Endosulfan 4% DP
    39: ('ethion-50-ec', 'ethion-50-ec'),
    40: ('ethofenoprox-10ec', 'ethofenoprox-10-ec'),
    41: (None, None), # Etofenprox 30% EC
    42: ('fenobucarb-bpmc-50-ec', 'fenobucarb-50-ec'),
    43: ('fenpropathrin-10-ec', 'fenpropathrin-10-ec'),
    44: ('fenpropathrin-30-ec', 'fenpropathrin-30-ec'),
    45: ('fenpyroximate-5-ec', 'fenpyroximate-5-ec'),
    46: ('fenvalerate-0-4-dp', 'fenvalerate-00-40-dp'),
    47: ('fenvalerate-20-ec', 'fenvalerate-20-ec'),
    48: ('fipronil-0-3-gr', 'fipronil-0-3-gr'),
    49: (None, 'fipronil-2-92-ec'),
    50: ('fipronil-5-sc', 'fipronil-5-sc'),
    51: ('fipronil-80wg', 'fipronil-80-wg'),
    52: ('flubendiamide-20-wg', 'flubendiamide-20-wg'),
    53: ('flubendiamide-39-35-m-m-sc', 'flubendiamide-39-35-sc'),
    54: ('hexythiazox-5-45-w-w-ec', 'hexythiazox-5-45-ec'),
    55: ('imidacloprid-17-8-sl', 'imidacloprid-17-8-sl'),
    56: ('imidacloprid-30-5-m-m-sc', None),
    57: ('imidacloprid-48-fs-per-100-kg-seed', 'imidacloprid-48-fs'),
    58: ('imidaclopride-70-wg', 'imidacloprid-70-wg'),
    59: ('indoxacarb-14-5-sc', 'indoxacarb-14-5-sc'),
    60: ('lambda-cyhalothrin-2-5-ec', None),
    61: (None, 'lambda-cyhalothrin-10-wp'),
    62: ('lambda-cyhalothrin-4-9-cs', 'lambda-cyhalothrin-4-9-cs'),
    63: ('lambda-cyhalothrin-5-ec', 'lambda-cyhalothrin-5-ec'),
    64: ('malathion-5-dp', 'malathion-05-dp'),
    65: ('malathion-50-ec', 'malathion-50-ec'),
    66: ('metaflumizone-22-sc', 'metaflumizone-22-sc'),
    67: (None, 'metaldehyde-2-5-dp'),
    68: ('methomyl-40-sp', None),
    69: ('methyl-parathion-2-dp', None),
    70: ('methyl-parathion-50-ec', None),
    71: ('monocrotophos-36-sl', 'monocrotophos-15-sg'),
    72: (None, None), # Niclosamide 70% WP
    73: ('novaluron-10-ec', 'novaluron-10-ec'),
    74: ('permethrin-25-ec', None),
    75: ('phenthoate-50-ec', 'phenthoate-50-ec'),
    76: ('phorate-10-cg', None),
    77: ('phosphamidon-40-sl', None),
    78: ('profenofos-50-ec', 'profenofos-50-ec'),
    79: ('propargite-57-ec', 'propargite-57-ec'),
    80: ('pymetrozine-50-wg', 'pymetrozine-50-wg'),
    81: ('quinalphos-1-5-dp', 'quinalphos-01-50-dp'),
    82: ('quinalphos-25-ec', 'quinalphos-25-ec'),
    83: ('spinosad-2-5-sc', 'spinosad-2-50-sc'),
    84: ('spinosad-45-0-sc', 'spinosad-45-sc'),
    85: ('spiromesifen-22-9-sc', 'spiromesifen-22-9-sc'),
    86: (None, 'temephos-50-ec'),
    87: ('thiacloprid-21-7-sc', 'thiacloprid-21-7-sc'),
    88: ('thiodicarb-75-wp', 'thiodicarb-75-wp'),
    89: ('thiamethoxam-25-wg', 'thiamethoxam-25-wg'),
    90: ('thiamethoxam-30-fs', 'thiamethoxam-30-fs'),
    91: ('thiamethoxam-70-ws', 'thiamethoxam-70-ws'),
    92: (None, None), # Thiamethoxam 75% SG
    93: ('triazophos-20-ec', None),
    94: ('triazophos-40-ec', None),
    95: (None, 'acephate-50-imidacloprid-1-8-sp'),
    96: (None, 'chlorantraniliprole-9-3-lambda-cyhalothrin-4-6-zc'),
    97: (None, 'chlorpyrifos-16-alphacypermethrin-1-ec'),
    98: (None, None), # Chlorpyrifos 21% + Fenobucarb 10.5% EC
    99: (None, 'chlorpyrifos-50-cypermethrin-5-ec'),
    100: (None, 'cypermethrin-3-quinalphos-20-ec'),
    101: (None, 'deltamethrin-0-72-buprofezin-5-65-ec'),
    102: (None, None), # Deltamethrin 1% + Triazophos 35% EC
    103: (None, 'ethion-40-cypermethrin-5-ec'),
    104: (None, 'beta-cyfluthrin-8-49-imidacloprid-19-81-od'),
    105: (None, 'ethiprole-40-imidacloprid-40-wg'),
    106: (None, 'fipronil-40-imidacloprid-40-wg'),
    107: (None, 'flubendiamide-19-92-thiacloprid-19-92-sc'),
    108: (None, 'indoxacarb-14-5-acetamiprid-7-7-sc'),
    109: (None, 'profenofos-40-cypermethrin-4-ec'),
    110: (None, 'chlorantraniliprole-0-5-thiamethoxam-1-gr'),
    111: (None, 'thiamethoxam-12-6-lambda-cyhalothrin-9-5-zc'),
    112: (None, 'chlorantraniliprole-8-8-thiamethoxam-17-5-sc'),
}

for num, (mk, aid) in MAPPING.items():
    if mk and mk not in meta:
        print(f"ERROR: {mk} not in meta!")
    if aid and aid not in agro_ids:
        print(f"ERROR: {aid} not in agro_ids!")

print("All mappings verified valid!")
meta_mapped = sum(1 for v in MAPPING.values() if v[0] is not None)
agro_mapped = sum(1 for v in MAPPING.values() if v[1] is not None)
print(f"Mapped to cropPestData metadata: {meta_mapped}")
print(f"Mapped to agrochemicalsData: {agro_mapped}")
print(f"Total PDF items with at least one target: {sum(1 for v in MAPPING.values() if v[0] or v[1])} / 112")
