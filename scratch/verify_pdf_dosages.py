import json

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

rows = data['rows']
meta = data['metadata']

sample_queries = [
    ("Cotton", "Chlorantraniliprole 18.5"),
    ("Cotton", "Emamectin Benzoate 5"),
    ("Cotton", "Flonicamid 50"),
    ("Cotton", "Dinotefuran 20"),
    ("Cotton", "Diafenthiuron 50"),
    ("Cotton", "Azadirachtin 0.15"),
    ("Cotton", "Phorate 10"),
    ("Paddy", "Chlorantraniliprole 0.4"),
    ("Paddy", "Chlorantraniliprole 18.5"),
    ("Paddy", "Cartap Hydrochloride 50"),
    ("Paddy", "Cartap Hydrochloride 4"),
    ("Paddy", "Fipronil 5"),
    ("Paddy", "Fipronil 0.3"),
    ("Chilli", "Spinetoram 11.7"),
    ("Chilli", "Diafenthiuron 50"),
    ("Tomato", "Chlorantraniliprole 18.5"),
    ("Tomato", "Cyantraniliprole 10.26"),
    ("Bengal gram", "Emamectin Benzoate 5"),
    ("Maize", "Chlorantraniliprole 18.5"),
    ("Sugarcane", "Chlorantraniliprole 18.5"),
    ("Ground nut", "Imidacloprid 17.8"),
    ("Bhendi", "Acetamiprid 20"),
]

print("="*115)
print(f"{'Crop':<12} | {'Insecticide':<32} | {'Page':<5} | {'Form. Dose / Ha (PDF)':<22} | {'Acre Dose':<16} | {'15L Pump Dose'}")
print("="*115)

for crop, chem in sample_queries:
    found = False
    for r in rows:
        if r['crop'].lower() == crop.lower():
            m = meta.get(r['metaKey'], {})
            name = m.get('insecticide', r['metaKey'])
            if chem.lower() in name.lower() or chem.lower().replace(' ', '') in r['metaKey'].replace('-', ''):
                acre_str = r['calculatedDosePerAcre'].replace('\u2013', '-')
                pump_str = r['calculatedDosePerPump'].replace('\u2013', '-')
                print(f"{r['crop']:<12} | {name[:32]:<32} | {r['cibrcPage']:<5} | {r['formulationDosePerHa']:<22} | {acre_str:<16} | {pump_str}")
                found = True
                break
    if not found:
        print(f"{crop:<12} | {chem:<32} | NOT FOUND")

print("="*115)
