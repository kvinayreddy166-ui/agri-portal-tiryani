import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Read singles_list.txt and combos_list.txt
with open('scratch/singles_list.txt', 'r', encoding='utf-8') as f:
    singles_raw = [line.strip().split('\t') for line in f if '\t' in line]

with open('scratch/combos_list.txt', 'r', encoding='utf-8') as f:
    combos_raw = [line.strip().split('\t') for line in f if '\t' in line]

# Filter singles strictly 1-295
singles = []
seen = set()
for num_str, name in singles_raw:
    num = int(num_str)
    if 1 <= num <= 295 and num not in seen:
        # clean any trailing herbicide text if on page 7
        name = name.split('B. HERBICIDES')[0].strip()
        singles.append((num, name))
        seen.add(num)

# Combos 683-879
combos = []
for num_str, name in combos_raw:
    num = int(num_str)
    if 683 <= num <= 879:
        name = name.split('B. FUNGICIDES')[0].strip()
        combos.append((num, name))

print(f'Clean singles count: {len(singles)}')
print(f'Clean combos count: {len(combos)}')

with open('scratch/all_registered_insecticides.txt', 'w', encoding='utf-8') as f:
    for num, name in singles:
        f.write(f'SINGLE\t{num}\t{name}\n')
    for num, name in combos:
        f.write(f'COMBO\t{num}\t{name}\n')

print('Saved scratch/all_registered_insecticides.txt')
