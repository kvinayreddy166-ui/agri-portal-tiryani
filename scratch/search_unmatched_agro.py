import re

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    agro_ts = f.read()

agro_items = re.findall(r'"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_ts)

queries = [
    'carbaryl', 'carbofuran', 'diafenthiuron', 'dichlorvos', 'dicofol',
    'emamectin', 'fenvalerate', 'imidacloprid', 'lambda', 'malathion',
    'methomyl', 'methyl', 'monocrotophos', 'permethrin', 'phorate',
    'phosphamidon', 'quinalphos', 'spinosad', 'spiromesifen', 'triazophos',
    'fenobucarb', 'thiamethoxam'
]

for q in queries:
    matched = [f"{i} ({n})" for i, n in agro_items if q in i.lower() or q in n.lower()]
    print(f"Query '{q}': {len(matched)} results -> {matched[:5]}")
