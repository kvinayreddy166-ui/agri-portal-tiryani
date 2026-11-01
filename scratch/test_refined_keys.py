import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/cibrc_gold_standard.json', 'r', encoding='utf-8') as f:
    gold_standard = json.load(f)

def clean_key(s):
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

gold_lookup = {}
for k, v in gold_standard.items():
    gold_lookup[k] = k
    gold_lookup[clean_key(v['raw_title'])] = k

# Check Imidacloprid 21% + Beta-cyfluthrin 10.5% w/w SC
k1 = clean_key("Imidacloprid 21% + Beta-cyfluthrin 10.5% w/w SC")
print("k1:", k1, "in gold_lookup:", k1 in gold_lookup)

# Check Isocycloseram 9.2% DC (10% W/V)
k2 = clean_key("Isocycloseram 9.2% DC (10% W/V)")
print("k2:", k2, "in gold_lookup:", k2 in gold_lookup)

# Check Metaldehyde 2.5% DP / Pellets
k3 = clean_key("Metaldehyde 2.5% DP")
print("k3:", k3, "in gold_lookup:", k3 in gold_lookup)
