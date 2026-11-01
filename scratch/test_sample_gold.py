import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

print(f"Total entries in gold standard: {len(gold_standard)}")

# Let's inspect claims from gold standard
sample_keys = ['abamectin19ec', 'chlorantraniliprole185sc', 'emamectinbenzoate5lufenuron40wg', 'acephate75sp', 'fipronil5sc']
for sk in sample_keys:
    if sk in gold_standard:
        print(f"\n--- {sk} ({gold_standard[sk]['raw_title']}) ---")
        print(f"Pages: {gold_standard[sk]['pages']}")
        for c in gold_standard[sk]['claims']:
            print("   Claim:", c)
    else:
        print(f"\n--- {sk} NOT in gold standard directly ---")
