import fitz
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

def clean(s):
    s = s.lower().replace(' ', '').replace('%w/w', '%').replace('%w/v', '%')
    s = s.replace('chlorpyriphos', 'chlorpyrifos').replace('betacyfluthrin', 'beta-cyfluthrin')
    return s

all_headers = []
for p in range(len(doc)):
    page = doc[p]
    # Check drawings or blocks with large/bold text or lines
    text = page.get_text('text')
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for line in lines:
        # Check if line looks like a chemical formulation
        if any(term in line for term in ['% SC', '% EC', '% WP', '% WG', '% GR', '% SP', '% SL', '% OD', '% FS', '% DP', '% CS', '% SE', '% WDG', '% DF', '% AS', '% EW', '% ME', '% Tablet', '% Pouch', '% Granules', '% SG', '% ZC', 'g/l', 'g/L']):
            if len(line) < 90 and not line.startswith('Dosage') and not line.startswith('Waiting') and not line.startswith('Approved'):
                all_headers.append((p + 1, line))

print(f'Found {len(all_headers)} potential formulation lines across the 108 pages.')
for p, h in all_headers[:25]:
    print(f'  P.{p}: {h}')
