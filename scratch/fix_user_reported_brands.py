import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Update cropPestData.json
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    cp = json.load(f)

tolfenpyrad_brands = [
    "Keefun (PI Industries)",
    "Brahamos (IIL)",
    "Tychi (Nichino)",
    "Patang (Tata Rallis)",
    "Keechak (Katyayani)"
]

if "tolfenpyrad-15-ec" in cp["metadata"]:
    cp["metadata"]["tolfenpyrad-15-ec"]["popularBrands"] = tolfenpyrad_brands
    print("Updated tolfenpyrad-15-ec in cropPestData.json")

with open("project/src/features/agrochemicals/data/cropPestData.json", "w", encoding="utf-8") as f:
    json.dump(cp, f, indent=2, ensure_ascii=False)

# 2. Update agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

updates = {
    "acephate-45-cypermethrin-5-df": [
        "Sorter (UPL)",
        "Panther (Aegis)"
    ],
    "tolfenpyrad-15-ec": tolfenpyrad_brands,
    "tolfenpyrad-18-75-emamectin-0-94-sc": [
        "Marito (Nichino India)",
        "Tajima Super (IFFCO)"
    ],
    "tolfenpyrad-15-bifenthrin-7-5-se": [
        "Raavan (GSP)",
        "Treza (AgroStar)"
    ],
    "tolfenpyrad-30-pyriproxyfen-10-acetamiprid-4-ec": [
        "Tolpy (SWAL)",
        "Trishanku (Best Agrolife)"
    ],
    "diafenthiuron-12-fipronil-8-tolfenpyrad-5-sc": [
        "TAG XL-825 (Tropical Agro)"
    ]
}

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
for aid, brands in updates.items():
    new_ts, ok = update_item_brands(new_ts, aid, brands)
    if ok:
        print(f"Updated {aid} in agrochemicalsData.ts")
    else:
        print(f"FAILED to update {aid} in agrochemicalsData.ts")

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "w", encoding="utf-8") as f:
    f.write(new_ts)

print("Updates saved successfully!")
