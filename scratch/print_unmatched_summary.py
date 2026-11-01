import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Run check on unmatched items
with open('scratch/test_full_matching.py', 'r', encoding='utf-8') as f:
    code = f.read()

# Add printing
exec(code)

print("\n--- Summary of the 151 remaining items ---")
for i, it in enumerate(unmatched_items[:40]):
    print(f"{i+1}. {it['name']}")
