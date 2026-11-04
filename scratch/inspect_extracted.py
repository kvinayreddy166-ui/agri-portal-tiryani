import json

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    rows = json.load(f)

print("First 10 rows:")
for r in rows[:10]:
    print(r)

print("\nSample rows from middle:")
for r in rows[250:260]:
    print(r)

print("\nSample rows from end:")
for r in rows[-10:]:
    print(r)
