import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']

from test_brand_parser import pdf_items

# We want to map each of the 145 keys in metadata to the right PDF item if applicable
# Let's see which metadata keys match which PDF items
meta_matches = {}

for mk, mv in meta.items():
    m_name = mv['insecticide']
    # Find matching PDF item
    matched_pdf = None
    for p in pdf_items:
        p_name = p['technical']
        # direct or cleaned comparison
        # Let's test standard chemical match
        def sim_key(name):
            n = name.lower()
            n = re.sub(r'[^a-z0-9]', '', n)
            n = n.replace('cg', 'gr').replace('g', 'gr')
            n = n.replace('alphamethrin', 'alphacypermethrin')
            n = n.replace('propergite', 'propargite')
            n = n.replace('profenophos', 'profenofos')
            n = n.replace('thiachloprid', 'thiacloprid')
            n = n.replace('methomil', 'methomyl')
            n = n.replace('dichlorovos', 'dichlorvos')
            n = n.replace('ddvp', 'dichlorvos')
            n = n.replace('seedtreatment', '')
            n = n.replace('per100kgseed', '')
            n = n.replace('mm', '')
            n = n.replace('ww', '')
            n = n.replace('wv', '')
            return n

        if sim_key(m_name) == sim_key(p_name):
            matched_pdf = p
            break
        # Also check without concentration or specific forms
        # e.g. "Carbofuran 3% CG" vs "Carbofuran 3% GR"
        if 'carbofuran' in m_name.lower() and 'carbofuran' in p_name.lower() and '3' in m_name and '3' in p_name:
            matched_pdf = p
            break
        if 'cartap' in m_name.lower() and 'cartap' in p_name.lower() and '4' in m_name and '4' in p_name:
            matched_pdf = p
            break
        if 'cartap' in m_name.lower() and 'cartap' in p_name.lower() and '50' in m_name and '50' in p_name:
            matched_pdf = p
            break
        if 'imidacloprid' in m_name.lower() and '48' in m_name and '48' in p_name:
            matched_pdf = p
            break
        if 'imidacloprid' in m_name.lower() and '70' in m_name and '70' in p_name:
            matched_pdf = p
            break
        if 'deltamethrin' in m_name.lower() and '11' in m_name and '11' in p_name:
            matched_pdf = p
            break
        if 'chlorpyrifos' in m_name.lower() and '10' in m_name and '10' in p_name and ('g' in m_name.lower() or 'gr' in p_name.lower()):
            matched_pdf = p
            break
        if 'fenobucarb' in m_name.lower() and 'fenobucarb' in p_name.lower():
            matched_pdf = p
            break
        if 'diafenthiuron' in m_name.lower() and 'diafenthiuron' in p_name.lower() and '50' in m_name:
            matched_pdf = p
            break
        if 'spinosad' in m_name.lower() and '45' in m_name and '45' in p_name:
            matched_pdf = p
            break
        if 'spinosad' in m_name.lower() and '2.5' in m_name and '2.5' in p_name:
            matched_pdf = p
            break
        if 'flubendiamide' in m_name.lower() and '39.35' in m_name and '39.35' in p_name:
            matched_pdf = p
            break
        if 'hexythiazox' in m_name.lower() and '5.45' in m_name and '5.45' in p_name:
            matched_pdf = p
            break
        if 'fenvalerate' in m_name.lower() and '0.4' in m_name and '0.4' in p_name:
            matched_pdf = p
            break
        if 'malathion' in m_name.lower() and '5' in m_name and '5' in p_name and 'dp' in m_name.lower():
            matched_pdf = p
            break
        if 'quinalphos' in m_name.lower() and '1.5' in m_name and '1.5' in p_name:
            matched_pdf = p
            break
        if 'etofenprox' in m_name.lower() or 'ethofenprox' in m_name.lower():
            if '10' in m_name and '10' in p_name:
                matched_pdf = p
                break

    if matched_pdf:
        meta_matches[mk] = matched_pdf

print(f"Total metadata keys matched with PDF items: {len(meta_matches)} / {len(meta)}")
for mk, p in sorted(meta_matches.items(), key=lambda x: x[1]['num']):
    print(f"PDF #{p['num']:<3} {p['technical']:<32} -> {mk:<30} ({meta[mk]['insecticide']}) | {len(p['brands'])} brands")
