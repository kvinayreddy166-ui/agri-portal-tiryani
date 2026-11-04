import re
from collections import Counter

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

cats = re.findall(r'"category":\s*"([^"]+)"', text)
print('Category counts:', Counter(cats))

claims_count = len(re.findall(r'"targetPest":', text))
print('Total label claims in dataset:', claims_count)

# Find all crops mentioned in cibrcApprovedClaims or targetCrops
crops = re.findall(r'"crop":\s*"([^"]+)"', text)
print('Total crop mentions in claims:', len(crops), 'Unique crops:', len(set(crops)))
print('Sample crops:', sorted(list(set(crops)))[:20])
