import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Match either "id": "val" or id: 'val'
existing_names = set(re.findall(r'(?:["\']name["\']|name)\s*:\s*["\']([^"\']+)["\']', ts_content))
existing_ids = set(re.findall(r'(?:["\']id["\']|id)\s*:\s*["\']([^"\']+)["\']', ts_content))

print(f'Existing items in TS: {len(existing_ids)}, names: {len(existing_names)}')

def clean_name(name):
    name = re.sub(r'\s+', ' ', name.lower().strip())
    name = name.replace('%w/w', '%').replace('% w/w', '%').replace('%w/v', '%').replace('% w/v', '%')
    name = re.sub(r'\s*([+%])\s*', r'\1', name)
    name = re.sub(r'0+(\d)', r'\1', name)
    name = name.replace('chlorpyriphos', 'chlorpyrifos')
    name = name.replace('lambdacyhalothrin', 'lambda-cyhalothrin')
    name = name.replace('alphacypermethrin', 'alpha-cypermethrin')
    name = name.replace('betacyfluthrin', 'beta-cyfluthrin')
    name = name.replace('allerthrin', 'allethrin')
    return name

cleaned_existing = {clean_name(n): n for n in existing_names}

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793557840927_1ae6a967.pdf')

def extract_section(start_page, end_page, min_num, max_num):
    items = []
    seen_nums = set()
    for p in range(start_page, end_page + 1):
        lines = doc[p].get_text().split('\n')
        curr_num = None
        curr_text = ''
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            m = re.match(r'^(\d+)\s*(.*)', line_str)
            if m:
                num = int(m.group(1))
                if min_num <= num <= max_num:
                    if curr_num is not None:
                        items.append((curr_num, curr_text.strip()))
                    curr_num = num
                    curr_text = m.group(2)
                else:
                    if curr_num is not None:
                        curr_text += ' ' + line_str
            else:
                if curr_num is not None:
                    curr_text += ' ' + line_str
        if curr_num is not None:
            items.append((curr_num, curr_text.strip()))
    return items

singles = extract_section(0, 6, 1, 295)
combos = extract_section(16, 20, 683, 879)

print(f'Extracted {len(singles)} singles (1-295), {len(combos)} combos (683-879).')

matched_singles = []
unmatched_singles = []
for num, name in singles:
    cn = clean_name(name)
    matched = False
    for ex_cn in cleaned_existing:
        if cn == ex_cn or (len(cn) > 8 and cn in ex_cn) or (len(ex_cn) > 8 and ex_cn in cn):
            matched = True
            break
    if matched:
        matched_singles.append((num, name))
    else:
        unmatched_singles.append((num, name))

matched_combos = []
unmatched_combos = []
for num, name in combos:
    cn = clean_name(name)
    matched = False
    for ex_cn in cleaned_existing:
        if cn == ex_cn or (len(cn) > 8 and cn in ex_cn) or (len(ex_cn) > 8 and ex_cn in cn):
            matched = True
            break
    if matched:
        matched_combos.append((num, name))
    else:
        unmatched_combos.append((num, name))

print(f'Singles: {len(matched_singles)} matched, {len(unmatched_singles)} missing.')
print(f'Combos: {len(matched_combos)} matched, {len(unmatched_combos)} missing.')

print('\nSample 15 Unmatched Singles:')
for item in unmatched_singles[:15]:
    print(f'  {item[0]}: {item[1]}')

print('\nSample 15 Unmatched Combos:')
for item in unmatched_combos[:15]:
    print(f'  {item[0]}: {item[1]}')
