import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/all_registered_insecticides.txt', 'r', encoding='utf-8') as f:
    lines = [l.strip().split('\t') for l in f if l.strip()]

print(f'Total in register: {len(lines)}')
singles = [l for l in lines if l[0] == 'SINGLE']
combos = [l for l in lines if l[0] == 'COMBO']
print(f'Singles (1 to 295): {len(singles)}')
print(f'Combos (683 to 879): {len(combos)}')

print('\nFirst 5 singles:')
for s in singles[:5]:
    print(' ', s)

print('\nLast 5 singles:')
for s in singles[-5:]:
    print(' ', s)

print('\nFirst 5 combos:')
for c in combos[:5]:
    print(' ', c)

print('\nLast 5 combos:')
for c in combos[-5:]:
    print(' ', c)
