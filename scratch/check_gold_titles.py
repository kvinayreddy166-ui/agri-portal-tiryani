import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

# Let's search gold standard raw titles for Abamectin, Chlorantraniliprole, Imidacloprid, Fipronil
for term in ['abamectin', 'chlorantraniliprole', 'imidacloprid', 'fipronil', 'deltamethrin']:
    matches = [v['raw_title'] for k, v in gold_standard.items() if term in k or term in v['raw_title'].lower()]
    print(f"Term '{term}' found in gold standard:")
    for m in matches:
        print("   ", m)
