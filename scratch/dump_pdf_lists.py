import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793557840927_1ae6a967.pdf')

def parse_items(pages, min_id, max_id):
    items = []
    curr_id = None
    curr_lines = []
    
    for p in pages:
        text = doc[p].get_text()
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            m = re.match(r'^(\d+)\s*(.*)', line)
            if m:
                num = int(m.group(1))
                if min_id <= num <= max_id:
                    if curr_id is not None:
                        items.append((curr_id, ' '.join(curr_lines).strip()))
                    curr_id = num
                    curr_lines = [m.group(2)] if m.group(2) else []
                else:
                    if curr_id is not None:
                        curr_lines.append(line)
            else:
                if curr_id is not None:
                    curr_lines.append(line)
    if curr_id is not None:
        items.append((curr_id, ' '.join(curr_lines).strip()))
    return items

singles = parse_items(range(0, 7), 1, 295)
combos = parse_items(range(16, 21), 683, 879)

print(f'Total singles parsed: {len(singles)}')
print(f'Total combos parsed: {len(combos)}')

with open('scratch/singles_list.txt', 'w', encoding='utf-8') as f:
    for num, name in singles:
        f.write(f'{num}\t{name}\n')

with open('scratch/combos_list.txt', 'w', encoding='utf-8') as f:
    for num, name in combos:
        f.write(f'{num}\t{name}\n')

print('Saved scratch/singles_list.txt and scratch/combos_list.txt')
