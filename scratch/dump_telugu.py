import json

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

with open('scratch/telugu_dump.txt', 'w', encoding='utf-8') as out:
    out.write('=== CROPS ===\n')
    crops = sorted(list(set((r['crop'], r.get('cropTe', '')) for r in data['rows'])))
    for c, cte in crops:
        out.write(f"{c} -> {cte}\n")

    out.write('\n=== PESTS ===\n')
    pests = sorted(list(set((r['pest'], r.get('pestTe', '')) for r in data['rows'])))
    for p, pte in pests:
        out.write(f"{p} -> {pte}\n")

    out.write('\n=== INSECTICIDES ===\n')
    for k, v in sorted(data['metadata'].items()):
        name = v.get('insecticide', '')
        name_te = v.get('insecticideTe', '')
        out.write(f"{k} -> {name} | {name_te}\n")

print('Dumped successfully to scratch/telugu_dump.txt')
