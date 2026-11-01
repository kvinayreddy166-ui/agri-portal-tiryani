import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/flagged_brands.txt', 'r', encoding='utf-8') as f:
    lines = [l.strip().split('\t') for l in f if l.strip()]

print(f'Remaining {len(lines)} flagged items:')
for l in lines:
    print(f'  {l[0]} | {l[1]} -> {l[2]}')
