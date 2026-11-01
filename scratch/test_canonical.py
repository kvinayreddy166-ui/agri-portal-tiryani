import re
import json

def canonical_form_key(s):
    # Lowercase
    s = s.lower().strip()
    # Normalize common chemical synonyms
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    s = s.replace('tablets', 'tab')
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    
    # Replace numbers like 01.90 with 1.9, 05 with 5, 00.40 with 0.4
    def norm_num(m):
        val = float(m.group(1))
        # Format as int if whole, or minimal float
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    # Strip all non-alphanumeric except maybe %
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

print("Abamectin 01.90 % EC ->", canonical_form_key("Abamectin 01.90 % EC"))
print("Abamectin 1.9% EC ->", canonical_form_key("Abamectin 1.9% EC"))
print("Chlorantraniliprole 18.50 % SC ->", canonical_form_key("Chlorantraniliprole 18.50 % SC"))
print("Chlorantraniliprole 18.5% SC ->", canonical_form_key("Chlorantraniliprole 18.5% SC"))
print("Deltamethrin 02.80 % EC ->", canonical_form_key("Deltamethrin 02.80 % EC"))
print("Deltamethrin 2.8% EC ->", canonical_form_key("Deltamethrin 2.8% EC"))
