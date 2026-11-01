import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

items = json.loads(text[start_pos:end_pos])

for item in items:
    if 'aluminiumphosphide15-tab' in item['id']:
        print("FOUND:", item['id'])
        print("Name:", item['name'])
        print("targetCrops:", item['targetCrops'])
        print("targetPests:", item['targetPests'])
        print("dosagePerAcre:", item['dosagePerAcre'])
        print("dosagePerLitre:", item['dosagePerLitre'])
        print("sprayPrecautions:", item['sprayPrecautions'])
        print("cibrcApprovedClaims:")
        for c in item['cibrcApprovedClaims']:
            print("   ", c)
