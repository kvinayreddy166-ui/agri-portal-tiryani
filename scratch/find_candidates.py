import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("project/src/features/agrochemicals/data/cropPestData.json", encoding="utf-8") as f:
    crop_pest = json.load(f)
meta = crop_pest["metadata"]

with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", encoding="utf-8") as f:
    agro_content = f.read()

agro_items = {}
for m in re.finditer(r'\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)"', agro_content):
    agro_items[m.group(1)] = m.group(2)

unmatched_chems = [
    (15, "Carbofuran 3%"),
    (19, "Chlorantraniliprole 0.4% w/w GR"),
    (20, "Chlorantraniliprole 18.5% ww Sc"),
    (22, "Cartap Hydrochloride"),
    (25, "Chlorpyrifos 75% WG"),
    (31, "Cyclaniliprole 10% DC"),
    (36, "Deltamethrin 100 EC (11% w/w)"),
    (46, "Emamectin Benzoate 3% + Thiamethoxam 12% WG"),
    (54, "Fenpyroximate 5% SC"),
    (57, "Fipronil 0.6% GR"),
    (63, "Fipronil 80 WG (80% ww)"),
    (65, "Flubendiamide 20% WDG,"),
    (66, "Flubendiamide 480 SC (39.35% ww)"),
    (67, "Flubendiamide 90 + Deltamethrin 60 SC"),
    (68, "Fluopyrum 34.48% SC"),
    (74, "Imidacloprid 30.5% SC"),
    (75, "Imidacloprid 600 FS (48% ww)"),
    (76, "Imidacloprid 6% + Lambda Cyhalothrin 4% SL"),
    (77, "Imidacloprid 70% WG (70% ww)"),
    (83, "• Isocycloseram 9.2% + Isocycloseram 10% DC"),
    (88, "Metaldehyde 2.5% Pellet"),
    (89, "Methoxyfenozide 20% + Chlorantraniliprole 5%"),
    (93, "Profenofos 40% + Fenpyroximate 2.5% EC"),
    (97, "Propargite 42% + Hexythiazox 2%"),
    (99, "Pyraclostrobin 10% + Fipronil 5% SC"),
    (103, "Pyriproxyfen 8% + Diafenthiuron 30% SE"),
    (105, "Pyriproxyfen 10% SC"),
    (106, "Pyriproxifen 5% + Difenthuron 25%"),
    (113, "Spirotetramat 11.01 + Imidacloprid 11.01% ww SC"),
    (114, "Spirotetramat 150 OD"),
    (115, "Thiacloprid 240 SC 21.7% ww"),
    (116, "Thiamethoxam 1% + Chlorantraniliprole 0.5% GR"),
    (117, "Thiamethoxam 12.60% + Lambda-cyhalothrin 9.50% ZC"),
    (121, "Thiocyclam Hydrogen Oxalate 3.0% + Clothianidin 1.2% GR"),
    (124, "Zinc Phosphide 80%"),
    (125, "Abamectin 1.8% EC"),
    (126, "Alpha-Cypermethrin 10% Alpha-Cypermethrin 10% WP"),
    (129, "Carbofuran 3% GR"),
    (136, "Chlorpyrifos 10% GR"),
    (140, "Cypermethrin 5% EC"),
    (141, "Deltamethrin 11% EC"),
    (142, "Diafenthiuron 50% SP"),
    (143, "Dichlorovos (DDVP) 76% EC"),
    (145, "Diflubenzuron 2% GR"),
    (146, "Diflubenzuron 2% TB"),
    (148, "Endosulfan 35% EC"),
    (149, "Endosulfan 4% DP"),
    (150, "Etofenprox 10% EC"),
    (151, "Etofenprox 30% EC"),
    (160, "Imidachloprid 30.5% SC")
]

for sno, chem in unmatched_chems:
    words = [w for w in re.split(r'[^a-zA-Z0-9]', chem.lower()) if len(w) > 2 and w not in ['the', 'and', 'for', 'with', 'group']]
    best_agro = []
    for aid, aname in agro_items.items():
        an = aname.lower()
        if all(w in an or w in aid for w in words[:2]):
            best_agro.append((aid, aname))
            
    best_meta = []
    for mid, mval in meta.items():
        mn = mval.get("insecticideName", "").lower()
        if all(w in mn or w in mid for w in words[:2]):
            best_meta.append((mid, mval.get("insecticideName")))
            
    print(f"[{sno}] {chem}")
    print(f"   Agro candidates: {best_agro[:4]}")
    print(f"   Meta candidates: {best_meta[:4]}")
