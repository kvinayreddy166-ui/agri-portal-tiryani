import json

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold = json.load(f)

print('Gold standard total entries/keys:', len(gold))
if isinstance(gold, list):
    print('Sample entry:', json.dumps(gold[0], indent=2)[:500])
elif isinstance(gold, dict):
    first_k = list(gold.keys())[0]
    print('Sample key:', first_k)
    print('Sample value:', json.dumps(gold[first_k], indent=2)[:500])
