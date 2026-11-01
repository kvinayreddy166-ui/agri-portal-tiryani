import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Let's inspect how items are serialized and ensure valid JSON/TypeScript formatting
with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

print(f"Loaded Gold Standard: {len(gold_standard)} formulations.")

# Check sample conversion
sample_claim = gold_standard['chlorantraniliprole185sc']['claims'][0]
print("Sample Chlorantraniliprole claim:", sample_claim)
