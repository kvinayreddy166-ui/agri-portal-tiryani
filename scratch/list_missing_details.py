import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/genuinely_missing.txt', 'r', encoding='utf-8') as f:
    missing_items = [l.strip().split('\t') for l in f if l.strip()]

print(f'Total missing items: {len(missing_items)}')

singles_missing = [x for x in missing_items if x[0] == 'SINGLE']
combos_missing = [x for x in missing_items if x[0] == 'COMBO']

print(f'Singles missing: {len(singles_missing)}')
print(f'Combos missing: {len(combos_missing)}')

print('\nAll Singles Missing:')
for x in singles_missing:
    print(f'  {x[1]:>3}: {x[2]}')

print('\nAll Combos Missing:')
for x in combos_missing:
    print(f'  {x[1]:>3}: {x[2]}')
