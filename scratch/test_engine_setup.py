import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Load CIB-RC Gold Standard
with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

print(f"Loaded Gold Standard with {len(gold_standard)} entries.")

def normalize_text(s):
    s = s.lower().strip()
    s = s.replace('spinoteram', 'spinetoram')
    s = s.replace('buprofenzin', 'buprofezin')
    s = s.replace('spiropidion', 'spiropidon')
    s = s.replace('pyrifluquinazon', 'pyrifluinazon')
    s = s.replace('allerthrin', 'allethrin')
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablets', 'tab').replace('tablet', 'tab')
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'\(.*?\)', '', s)
    
    def norm_num(m):
        val = float(m.group(1))
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

# Build comprehensive lookup table
gold_lookup = {}
for k, v in gold_standard.items():
    gold_lookup[k] = k
    gold_lookup[normalize_text(v['raw_title'])] = k

print(f"Gold lookup size: {len(gold_lookup)}")
