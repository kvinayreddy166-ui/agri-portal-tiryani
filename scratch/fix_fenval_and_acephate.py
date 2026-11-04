import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

clean_fenval_brands = [
    "Fenval (Jivagro)",
    "Krifen (KR)",
    "Fenkill (UPL)",
    "King Pen (KCS)",
    "Fenval 20 EC (Isagro Asia)",
    "Devifen 20 (Devidayal)",
    "Tatafen (Tata Rallis)",
    "Fencot 20 E (Kilpest)",
    "Final 20 (AOL)"
]

acephate_fenval_brands = [
    "Koranda (Rallis)",
    "Finance (Senso Agrotech)",
    "Contra (Sai Ram)"
]

# 1. Update cropPestData.json
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

if "fenvalerate-20-ec" in cp["metadata"]:
    cp["metadata"]["fenvalerate-20-ec"]["popularBrands"] = clean_fenval_brands
    print("Cleaned fenvalerate-20-ec in cropPestData.json")

with open("project/src/features/agrochemicals/data/cropPestData.json", "w", encoding="utf-8") as f:
    json.dump(cp, f, indent=2, ensure_ascii=False)

# 2. Update agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

def update_item_brands(content, item_id, brands):
    pattern = re.compile(r'(\{\s*"id":\s*"' + re.escape(item_id) + r'",.*?"popularBrands":\s*)\[[^\]]*\]', re.DOTALL)
    m = pattern.search(content)
    if not m:
        return content, False
    
    brands_formatted = json.dumps(brands, indent=6, ensure_ascii=False)
    brands_lines = brands_formatted.split('\n')
    indented_brands = brands_lines[0] + '\n' + '\n'.join('    ' + l for l in brands_lines[1:])
    
    new_content = content[:m.start()] + m.group(1) + indented_brands + content[m.end():]
    return new_content, True

new_ts = agro_ts

# Update acephate-25-fenvalerate-3-ec
new_ts, ok1 = update_item_brands(new_ts, "acephate-25-fenvalerate-3-ec", acephate_fenval_brands)
print("Updated acephate-25-fenvalerate-3-ec in agrochemicalsData.ts:", ok1)

# Update fenvalerate-20-ec
new_ts, ok2 = update_item_brands(new_ts, "fenvalerate-20-ec", clean_fenval_brands)
print("Cleaned fenvalerate-20-ec in agrochemicalsData.ts:", ok2)

# Update fenvalerate-02-conc
new_ts, ok3 = update_item_brands(new_ts, "fenvalerate-02-conc", clean_fenval_brands)
print("Cleaned fenvalerate-02-conc in agrochemicalsData.ts:", ok3)

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "w", encoding="utf-8") as f:
    f.write(new_ts)

print("Saved all updates!")
