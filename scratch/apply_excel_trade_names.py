import openpyxl
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Load data
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    crop_pest = json.load(f)

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

junk_patterns = [
    r'neonicotinoids\s+group.*',
    r'synthetic\s+pyrethroid\s+group.*',
    r'organochlorine\s+group.*',
    r'cyclodiene.*',
    r'it\s+is\s+photostable.*',
    r'it\s+belong.*',
    r'urcouples\s+of\s+oxidative.*',
    r'non-systemic.*',
    r'systemic\s+insecticide.*',
    r'contact\s+and\s+stomach.*',
    r'broad\s+spectrum.*',
    r'chloronicotinyl\s+group.*',
]

def clean_brand_token(token, chem_name=""):
    t = token.strip()
    if not t:
        return None
    t = t.strip(' .,;:/|')
    for jp in junk_patterns:
        t = re.sub(jp, '', t, flags=re.IGNORECASE).strip()
    if not t:
        return None
        
    if t.endswith('(Sulphur'):
        t = t + ' Mills)'
        
    m = re.match(r'^\(([^)]+)\)\s*(.+)$', t)
    if m:
        comp, brand = m.groups()
        t = f"{brand.strip()} ({comp.strip()})"
        
    known_prefix_companies = ['FMC', 'EBS', 'Sumitomo', 'Multiplex', 'Best Agrolife', 'PI', 'Adama']
    for comp in known_prefix_companies:
        m = re.match(r'^' + re.escape(comp) + r'\s+([A-Za-z0-9\-\s\+\.]+)', t, flags=re.IGNORECASE)
        if m and '(' not in t:
            brand = m.group(1).strip()
            t = f"{brand} ({comp})"
            break
            
    t = re.sub(r'([A-Za-z0-9])\(', r'\1 (', t)
    
    if chem_name:
        cn = chem_name.strip()
        t = re.sub(r'^' + re.escape(cn) + r'\s*', '', t, flags=re.IGNORECASE).strip()
        words = cn.split()
        if len(words) >= 1:
            w0 = words[0]
            t = re.sub(r'^' + re.escape(w0) + r'\s+\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', t, flags=re.IGNORECASE).strip()
            
    t = re.sub(r'^\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', t, flags=re.IGNORECASE).strip()
    if re.match(r'^\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?$', t, flags=re.IGNORECASE):
        return None
    if re.match(r'^(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)$', t, flags=re.IGNORECASE):
        return None
    t = t.strip(' .,;:/|')
    if not t:
        return None
    return t

def parse_brands_string(raw_text, chem_name=""):
    if not raw_text:
        return []
    text = raw_text.replace('\n', ' ').strip()
    tokens = re.split(r'[,;|]|\s*\|\s*|(?<=\))\s+(?=[A-Za-z0-9\(\]])', text)
    cleaned = []
    seen = set()
    for tok in tokens:
        c = clean_brand_token(tok, chem_name)
        if not c:
            continue
        key = c.lower().replace(' ', '')
        if key not in seen:
            seen.add(key)
            cleaned.append(c)
    return cleaned

OVERRIDES = {
    1: (None, "abamectin-1-9-ec"),
    2: (None, "acephate-50-imidacloprid-1-8-sp"),
    3: ("acephate-75-sp", "acephate-75-sp"),
    4: ("acephate-95-sg", "acephate-95-sg"),
    5: (None, "acequinocyl-15-sc"),
    6: ("acetamiprid-20-sp", "acetamiprid-20-sp"),
    7: (None, "acetamiprid-25-bifenthrin-25-wg"),
    8: ("alphacypermethrin-10-ec", "alphacypermethrin-10-ec"),
    9: (None, "beta-cyfluthrin-8-49-imidacloprid-19-81-od"),
    10: (None, "bifenthrin-8-clothianidin-10-sc"),
    11: ("bifenthrin-10-ec", "bifenthrin-10-ec"),
    12: (None, "broflanilide-20-sc"),
    13: ("buprofezin-25-sc", "buprofezin-25-sc"),
    14: (None, "buprofezin-15-acephate-35-wp"),
    15: ("carbofuran-3-cg", "carbofuran-3-cg"),
    16: ("carbosulfan-25-ec", "carbosulfan-25-ec"),
    17: ("carbosulfan-25-ds", "carbosulfan-25-ds"),
    18: (None, "cartap-7-5-emamectin-0-25-gr"),
    19: ("chlorantraniliprole-0-4-gr", "chlorantraniliprole-0-4-gr"),
    20: ("chlorantraniliprole-18-5-sc", "chlorantraniliprole-18-5-sc"),
    21: (None, "chlorantraniliprole-8-8-thiamethoxam-17-5-sc"),
    22: ("cartap-hydrochloride-50-sp", "cartap-hydrochloride-50-sp"),
    23: (None, "chlorantraniliprole-9-3-lambda-cyhalothrin-4-6-zc"),
    24: ("chlorpyrifos-50-ec", "chlorpyrifos-50-ec"),
    25: (None, None),
    26: ("chlorpyrifos-1-5-dp", "chlorpyrifos-1-5-dp"),
    27: ("chlorpyrifos-20-ec", "chlorpyrifos-20-ec"),
    28: (None, "chlorpyrifos-50-cypermethrin-5-ec"),
    29: ("clothianidin-50-wdg", "clothianidin-50-wdg"),
    30: ("cyantraniliprole-10-26-od", "cyantraniliprole-10-26-od"),
    31: (None, "cyclaniliprole-100-dc"),
    32: (None, "cyenopyrafen-30-sc"),
    33: ("cypermethrin-25-ec", "cypermethrin-25-ec"),
    34: (None, "cypermethrin-3-quinalphos-20-ec"),
    35: (None, "deltamethrin-1-25-ulv"),
    36: ("deltamethrin-11-w-w-ec", "deltamethrin-11-w-w-ec"),
    37: ("deltamethrin-2-8-ec", "deltamethrin-2-8-ec"),
    38: (None, "diafenthiuron-40-spinetoram-5-sc"),
    39: ("diafenthiuron-50wp", "diafenthiuron-50-wp"),
    40: ("dimethoate-30-ec", "dimethoate-30-ec"),
    41: (None, "dinotefuran-15-pymetrozine-45-wg"),
    42: (None, "dinotefuran-70-wg"),
    43: (None, "emamectin-1-5-fipronil-3-5-sc"),
    44: (None, "emamectinbenzoate1-5-profenofos-35-wdg"),
    45: ("emamectin-benzoate-1-9-ec", "emamectinbenzoate-01-90-ec"),
    46: (None, None),
    47: ("emamectin-benzoate-5-sg", "emamectin-benzoate-5-sg"),
    48: ("ethion-50-ec", "ethion-50-ec"),
    49: (None, "ethiprole-10-7-pymetrozine-40-wg"),
    50: (None, "etofenprox-6-diafenthiuron-25-wg"),
    51: ("fenobucarb-bpmc-50-ec", "fenobucarb-50-ec"),
    52: (None, "fenpropathrin-10-ec"),
    53: (None, "fenpropathrin-30-ec"),
    54: ("fenpyroximate-5-ec", "fenpyroximate-05-sc"),
    55: ("fenvalerate-0-4-dp", "fenvalerate-00-40-dp"),
    56: ("fenvalerate-20-ec", "fenvalerate-20-ec"),
    57: ("fipronil-0-3-gr", "fipronil-0-3-gr"),
    58: (None, "fipronil-10-diafenthiuron-30-wg"),
    59: (None, None),
    60: (None, "fipronil-15-imidacloprid-5-sc"),
    61: (None, "fipronil-40-imidacloprid-40-wg"),
    62: ("fipronil-5-sc", "fipronil-5-sc"),
    63: ("fipronil-80wg", "fipronil-80-wg"),
    64: (None, "flonicamid-50-wg"),
    65: ("flubendiamide-20-wg", "flubendiamide-20-wg"),
    66: ("flubendiamide-39-35-m-m-sc", "flubendiamide-39-35-sc"),
    67: (None, "flubendiamide-8-33-deltamethrin-5-56-sc"),
    68: (None, None),
    69: (None, "flupyradifurone-17-09-sl"),
    70: (None, "fluxametamide-10-ec"),
    71: ("hexythiazox-5-45-w-w-ec", "hexythiazox-5-45-ec"),
    72: ("imidacloprid-0-3-gr", "imidacloprid-0-30-gr"),
    73: ("imidacloprid-17-8-sl", "imidacloprid-17-8-sl"),
    74: ("imidacloprid-30-5-m-m-sc", "imidacloprid-30-50-m-m-sc"),
    75: ("imidacloprid-48-fs-per-100-kg-seed", "imidacloprid-48-fs"),
    76: (None, "imidacloprid-6-0-lambdacyhalothrin-4-0-sl"),
    77: ("imidaclopride-70-wg", "imidacloprid-70-wg"),
    78: (None, "indoxacarb-10-thiamethoxam-10-wg"),
    79: (None, "indoxacarb-14-5-acetamiprid-7-7-sc"),
    80: ("indoxacarb-14-5-sc", "indoxacarb-14-5-sc"),
    81: (None, "indoxacarb-5-fipronil-5-sc"),
    82: (None, "isocycloseram-18-1-sc"),
    83: (None, "isocycloseram-9-2-w-w-dc"),
    84: (None, "lambda-cyhalothrin-10-wp"),
    85: ("lambda-cyhalothrin-4-9-cs", "lambda-cyhalothrin-4-9-cs"),
    86: ("lambda-cyhalothrin-5-ec", "lambda-cyhalothrin-5-ec"),
    87: ("malathion-50-ec", "malathion-50-ec"),
    88: (None, "metaldehyde-2-5-dp"),
    89: (None, "methoxyfenozide-20-chlorantraniliprole-5-sc"),
    90: (None, "profenofos-40-cypermethrin-4-ec"),
    91: (None, "phenthoate-50-ec"),
    92: ("permethrin-25-ec", None),
    93: (None, "profenofos-40-fenpyroximate2-50-ec"),
    94: ("profenofos-50-ec", "profenofos-50-ec"),
    95: ("propargite-57-ec", "propargite-57-ec"),
    96: (None, "propargite-50-bifenthrin-5-se"),
    97: (None, "propargite-42-hexythiazox-2-ec"),
    98: (None, "pymetrozine-50-wg"),
    99: (None, None),
    100: (None, "pyridaben-20-wp"),
    101: (None, "pyrifluquinazon-20-wg"),
    102: (None, "pyridalyl-10-ec"),
    103: (None, "diafenthiuron-30-pyriproxyfen-8-se"),
    104: (None, "pyriproxyfen-10-bifenthrin-10-ec"),
    105: ("pyriproxyfen-10-ec", "pyriproxyfen-10-ec"),
    106: (None, "pyriproxyfen-5-0-diafenthiuron-25-se"),
    107: (None, "pyriproxyfen-5-fenpropathrin-15-ec"),
    108: (None, "pyriproxyfen-8-dinotefuran5-diafenthiuron18-sc"),
    109: ("quinalphos-25-ec", "quinalphos-25-ec"),
    110: (None, "spinetoram-11-7-sc"),
    111: ("spinosad-2-5-sc", "spinosad-2-50-sc"),
    112: ("spiromesifen-22-9-sc", "spiromesifen-22-9-sc"),
    113: (None, "spirotetramat-11-01-imidacloprid-11-01-sc"),
    114: (None, "spirotetramat-15-31-od"),
    115: (None, "thiacloprid-21-7-sc"),
    116: (None, "thiamethoxam-1-0-chlorantraniliprole-0-5-gr"),
    117: (None, "thiamethoxam-12-6-lambda-cyhalothrin-9-5-zc"),
    118: ("thiamethoxam-25-wg", "thiamethoxam-25-wg"),
    119: (None, "thiamethoxam-30-fs"),
    120: (None, "thiamethoxam-70-ws"),
    121: (None, "thiocyclam-3-clothianidin-1-2-gr"),
    122: (None, "tolfenpyrad-15-ec"),
    123: (None, "triflumezopyrim-10-sc"),
    124: (None, "zinc-phosphide-80-powder"),
    125: (None, "abamectin-1-9-ec"),
    126: (None, None),
    127: (None, None),
    128: ("carbaryl-50-wp", None),
    129: ("carbofuran-3-cg", "carbofuran-3-cg"),
    130: ("cartap-hydrochloride-4-g", "cartap-hydrochloride-4-gr"),
    131: ("cartap-hydrochloride-50-sp", "cartap-hydrochloride-50-sp"),
    132: ("chlorantraniliprole-0-4-gr", "chlorantraniliprole-0-4-gr"),
    133: ("chlorantraniliprole-18-5-sc", "chlorantraniliprole-18-5-sc"),
    134: (None, "chlorfenapyr-10-sc"),
    135: ("chlorpyrifos-1-5-dp", "chlorpyrifos-1-5-dp"),
    136: ("chlorpyrifos-10-g", "chlorpyrifos-10-granules"),
    137: ("chlorpyrifos-20-ec", "chlorpyrifos-20-ec"),
    138: (None, "chromafenozide-80-wp"),
    139: ("cypermethrin-10-ec", "cypermethrin-10-ec"),
    140: (None, None),
    141: ("deltamethrin-11-w-w-ec", "deltamethrin-11-w-w-ec"),
    142: ("diafenthiuron-50wp", "diafenthiuron-50-wp"),
    143: ("dichlorvos-76-ec", None),
    144: ("dicofol-18-5-ec", None),
    145: (None, "diflubenzuron-02-gr"),
    146: (None, "diflubenzuron-02-tablets"),
    147: (None, "dinotefuran-20-sg"),
    148: (None, None),
    149: (None, None),
    150: (None, None),
    151: (None, None),
    152: ("fenobucarb-bpmc-50-ec", "fenobucarb-50-ec"),
    153: ("fenpyroximate-5-ec", "fenpyroximate-5-ec"),
    154: ("fipronil-0-3-gr", "fipronil-0-3-gr"),
    155: (None, None),
    156: ("fipronil-80wg", "fipronil-80-wg"),
    157: ("flubendiamide-20-wg", "flubendiamide-20-wg"),
    158: ("flubendiamide-39-35-m-m-sc", "flubendiamide-39-35-sc"),
    159: ("imidacloprid-17-8-sl", "imidacloprid-17-8-sl"),
    160: ("imidacloprid-30-5-m-m-sc", "imidacloprid-30-50-m-m-sc"),
}

VARIANTS = {
    'alphacypermethrin-10-sc': 8,
    'cypermethrin-0-25-dp': 33,
    'deltamethrin-2-5-wp': 37,
    'fenvalerate-02-conc': 56,
}

meta_brands_map = {}
agro_brands_map = {}

def add_brands(dest_map, key, brand_list):
    if not key:
        return
    if key not in dest_map:
        dest_map[key] = []
    seen = {b.lower().replace(' ', ''): b for b in dest_map[key]}
    for b in brand_list:
        norm = b.lower().replace(' ', '')
        if norm not in seen:
            seen[norm] = b
            dest_map[key].append(b)

for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    raw = ws.cell(r, 3).value
    if not chem:
        continue
    sno = int(sno) if isinstance(sno, float) else sno
    chem = chem.strip()
    brands = parse_brands_string(str(raw), chem)
    
    mk, aid = OVERRIDES.get(sno, (None, None))
    if mk:
        add_brands(meta_brands_map, mk, brands)
    if aid:
        add_brands(agro_brands_map, aid, brands)

for aid, sno in VARIANTS.items():
    raw = ws.cell(sno + 1, 3).value
    chem = ws.cell(sno + 1, 2).value
    brands = parse_brands_string(str(raw), chem)
    add_brands(agro_brands_map, aid, brands)

# Also synchronize to meta if an agro id matches an existing meta key
for mid in crop_pest["metadata"].keys():
    if mid in agro_brands_map and mid not in meta_brands_map:
        meta_brands_map[mid] = agro_brands_map[mid]

print(f"Applying updates to {len(meta_brands_map)} cropPestData.json metadata keys...")
meta_updated = 0
for mid, brands in meta_brands_map.items():
    if mid in crop_pest["metadata"]:
        crop_pest["metadata"][mid]["popularBrands"] = brands
        meta_updated += 1
    else:
        print(f"Warning: meta key '{mid}' not found")

with open("project/src/features/agrochemicals/data/cropPestData.json", "w", encoding="utf-8") as f:
    json.dump(crop_pest, f, indent=2, ensure_ascii=False)

print(f"Successfully updated {meta_updated} metadata entries in cropPestData.json.")

print(f"Applying updates to {len(agro_brands_map)} agrochemicalsData.ts items...")
def update_item_brands(content, item_id, brands):
    pattern = re.compile(r'(\{\s*"id":\s*"' + re.escape(item_id) + r'",.*?"popularBrands":\s*)\[[^\]]*\]', re.DOTALL)
    m = pattern.search(content)
    if not m:
        return content, False
    
    # Format new brands JSON
    brands_formatted = json.dumps(brands, indent=6, ensure_ascii=False)
    brands_lines = brands_formatted.split('\n')
    indented_brands = brands_lines[0] + '\n' + '\n'.join('    ' + l for l in brands_lines[1:])
    
    new_content = content[:m.start()] + m.group(1) + indented_brands + content[m.end():]
    return new_content, True

new_agro_ts = agro_ts
agro_updated = 0
for aid, brands in agro_brands_map.items():
    new_agro_ts, success = update_item_brands(new_agro_ts, aid, brands)
    if success:
        agro_updated += 1
    else:
        print(f"Warning: id '{aid}' not found in agrochemicalsData.ts")

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "w", encoding="utf-8") as f:
    f.write(new_agro_ts)

print(f"Successfully updated {agro_updated} items in agrochemicalsData.ts.")
