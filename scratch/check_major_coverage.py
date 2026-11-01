import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

major_doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

pages_text = []
for p in range(len(major_doc)):
    pages_text.append(major_doc[p].get_text())

with open('scratch/genuinely_missing_v2.txt', 'r', encoding='utf-8') as f:
    missing = [l.strip().split('\t') for l in f if l.strip()]

found_in_major = 0
not_found_in_major = 0

for itype, num, name in missing:
    # search for key parts of the name
    # e.g., if 'Acephate 97% DF', search for '97% DF' or '97 % DF'
    words = name.split()
    matched_pages = []
    # try matching active + concentration
    active = words[0]
    conc = words[1] if len(words) > 1 else ''
    
    clean_search = f'{active}.*{conc}'.lower()
    for p_idx, text in enumerate(pages_text):
        if re.search(clean_search, text.lower()):
            matched_pages.append(p_idx + 1)
            
    if matched_pages:
        found_in_major += 1
    else:
        not_found_in_major += 1

print(f'Missing items: {len(missing)}')
print(f'Items found in Major Uses 108-page PDF: {found_in_major}')
print(f'Items not in Major Uses (e.g. public health / household / recent registrations): {not_found_in_major}')
