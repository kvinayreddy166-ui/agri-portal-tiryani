import json
import re

with open('project/src/features/agrochemicals/data/cropPestData.json', 'r', encoding='utf-8') as f:
    cp = json.load(f)

meta = cp['metadata']
print('cropPestData metadata keys:', len(meta))

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Match entries with id, name, category, popularBrands
matches = re.findall(r'id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",\s*"nameTe":\s*"([^"]+)",\s*"category":\s*"([^"]+)"', content)
print('agrochemicalsData items:', len(matches))
insecticides_in_agro = [m for m in matches if m[3] == 'insecticide']
print('insecticides in agrochemicalsData:', len(insecticides_in_agro))
