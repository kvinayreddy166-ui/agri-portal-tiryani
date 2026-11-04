import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

# Parse items from agrochemicalsData.ts
agro_dict = {}
item_pattern = re.compile(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"[^{}]*?"popularBrands":\s*\[([^\]]*)\]', re.DOTALL)
for m in item_pattern.finditer(agro_ts):
    brands_str = m.group(3)
    brands = [b.strip().strip('"').strip("'") for b in brands_str.split(',') if b.strip().strip('"').strip("'")]
    agro_dict[m.group(1)] = {
        'id': m.group(1),
        'name': m.group(2),
        'popularBrands': brands
    }

from parse_pdf_insecticides import pdf_raw_data

lines = [l.strip() for l in pdf_raw_data.strip().split('\n') if l.strip()]

pdf_items = []
for line in lines:
    m = re.match(r'^(\d+)\.\s*(.*?)\s*\|\s*(.*)$', line)
    if m:
        num = int(m.group(1))
        tech = m.group(2).strip()
        brands_raw = m.group(3).strip()
        parts = [p.strip() for p in brands_raw.split(',') if p.strip()]
        pdf_items.append({
            'num': num,
            'technical': tech,
            'brands': parts
        })

print(f"Total parsed PDF items: {len(pdf_items)}")

# Normalizing function
def clean(s):
    s = s.lower()
    s = s.replace('%', ' ')
    s = s.replace('+', ' ')
    s = s.replace('/', ' ')
    s = s.replace('-', ' ')
    s = s.replace('w/w', ' ')
    s = s.replace('w/v', ' ')
    s = s.replace('m/m', ' ')
    s = s.replace('(', ' ')
    s = s.replace(')', ' ')
    s = s.replace('seed treatment', ' ')
    s = s.replace('alphamethrin', 'alphacypermethrin')
    s = s.replace('alpha cypermethrin', 'alphacypermethrin')
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('profenophos', 'profenofos')
    s = s.replace('propergite', 'propargite')
    s = s.replace('dichlorovos', 'dichlorvos')
    s = s.replace('ddvp', 'dichlorvos')
    s = s.replace('thiachloprid', 'thiacloprid')
    s = s.replace('methomil', 'methomyl')
    s = s.replace('ethofenoprox', 'etofenprox')
    s = s.replace('ethofenprox', 'etofenprox')
    s = s.replace('imidachloprid', 'imidacloprid')
    s = s.replace('granules', 'gr')
    s = s.replace('cg', 'gr')
    s = s.replace('g', 'gr')
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def tokens(s):
    return set(clean(s).split())

# Try matching each PDF item to cropPestData metadata and agrochemicalsData
matches_summary = []

for p in pdf_items:
    p_tech = p['technical']
    p_tokens = tokens(p_tech)
    
    # 1. Match in cropPestData metadata
    best_meta_key = None
    best_meta_score = 0
    for mk, mv in meta.items():
        m_tokens = tokens(mv['insecticide'])
        if p_tokens == m_tokens:
            best_meta_key = mk
            best_meta_score = 100
            break
        common = p_tokens.intersection(m_tokens)
        if len(common) >= len(p_tokens) * 0.8 and len(common) >= len(m_tokens) * 0.8:
            score = len(common)
            if score > best_meta_score:
                best_meta_score = score
                best_meta_key = mk
    
    # 2. Match in agrochemicalsData.ts
    best_agro_id = None
    best_agro_score = 0
    for aid, av in agro_dict.items():
        a_tokens = tokens(av['name'])
        if p_tokens == a_tokens:
            best_agro_id = aid
            best_agro_score = 100
            break
        common = p_tokens.intersection(a_tokens)
        if len(common) >= len(p_tokens) * 0.8 and len(common) >= len(a_tokens) * 0.8:
            score = len(common)
            if score > best_agro_score:
                best_agro_score = score
                best_agro_id = aid

    matches_summary.append({
        'num': p['num'],
        'technical': p_tech,
        'brands_count': len(p['brands']),
        'meta_key': best_meta_key,
        'meta_name': meta[best_meta_key]['insecticide'] if best_meta_key else None,
        'agro_id': best_agro_id,
        'agro_name': agro_dict[best_agro_id]['name'] if best_agro_id else None,
    })

print(f"{'#':<4} {'PDF Technical':<35} {'Meta Key':<30} {'Agro ID':<30}")
print("-" * 105)
for m in matches_summary:
    mk_str = m['meta_key'] or '---'
    ag_str = m['agro_id'] or '---'
    print(f"{m['num']:<4} {m['technical']:<35} {mk_str:<30} {ag_str:<30}")
