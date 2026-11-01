import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/genuinely_missing_v2.txt', 'r', encoding='utf-8') as f:
    missing = [l.strip().split('\t') for l in f if l.strip()]

actives = set()

for itype, num, name in missing:
    # remove percentages and formulation codes
    cleaned = re.sub(r'\d+(?:\.\d+)?\s*%', '', name)
    cleaned = re.sub(r'\d+(?:\.\d+)?\s*g/[lL]', '', cleaned)
    cleaned = re.sub(r'\b(EC|SC|WP|WG|GR|SP|SL|OD|FS|DP|CS|SE|WDG|DF|AS|EW|ME|Tab|Tablet|Pouch|Coil|Mat|Chalk|Bait|Vaporiser|Vaporizer|Gel|Dust|Aerosol|LLIN|RTU|Smoke|Generator|conc|Conc|RB|CB|CG|DS|VP|MUP|OS|w/w|w/v|m/m|u/s|Household|Product)\b', '', cleaned, flags=re.IGNORECASE)
    parts = re.split(r'[\+\&]', cleaned)
    for p in parts:
        p = p.strip()
        p = re.sub(r'^\d+\s*', '', p) # remove leading digits
        p = re.sub(r'\([^\)]*\)', '', p)
        p = p.strip()
        if len(p) > 2:
            actives.add(p)

print(f'Found {len(actives)} unique active component names:')
for a in sorted(actives):
    print(f'  {a}')
