import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# 1. Verify cropPestData.json
with open("project/src/features/agrochemicals/data/cropPestData.json", "r", encoding="utf-8") as f:
    crop_pest = json.load(f)

print("cropPestData.json validation:")
print(f"  Rows count: {len(crop_pest['rows'])}")
print(f"  Metadata count: {len(crop_pest['metadata'])}")

# Check some keys
sample_keys = ['acephate-75-sp', 'abamectin-1-9-ec', 'buprofezin-25-sc', 'fipronil-5-sc', 'imidacloprid-17-8-sl']
for k in sample_keys:
    if k in crop_pest['metadata']:
        print(f"  [{k}] brands count: {len(crop_pest['metadata'][k].get('popularBrands', []))}")
        print(f"     Brands: {crop_pest['metadata'][k].get('popularBrands', [])[:4]}")

# Verify rows structure is undisturbed
sample_row = crop_pest['rows'][0]
print(f"  Row 0 crop: {sample_row.get('crop')} ({sample_row.get('cropTe')}), pest: {sample_row.get('pest')} ({sample_row.get('pestTe')})")
print(f"  Row 0 dose: {sample_row.get('dosagePerAcre')}, formulation: {sample_row.get('formulation')}")

# 2. Verify agrochemicalsData.ts
with open("project/src/features/agrochemicals/data/agrochemicalsData.ts", "r", encoding="utf-8") as f:
    agro_ts = f.read()

print("\nagrochemicalsData.ts validation:")
id_matches = re.findall(r'"id":\s*"([^"]+)"', agro_ts)
name_matches = re.findall(r'"name":\s*"([^"]+)"', agro_ts)
dose_matches = re.findall(r'"dosage":\s*"([^"]+)"', agro_ts)
moa_matches = re.findall(r'"moaGroup":\s*"([^"]+)"', agro_ts)
print(f"  Total IDs: {len(id_matches)}")
print(f"  Total Names: {len(name_matches)}")
print(f"  Total Dosages: {len(dose_matches)}")
print(f"  Total MoA Groups: {len(moa_matches)}")

# Check diff lines in git to ensure only popularBrands changed
import subprocess
diff_out = subprocess.check_output(["git", "diff", "-U0", "project/src/features/agrochemicals/data/agrochemicalsData.ts"], text=True, encoding="utf-8", errors="replace")

non_brand_changes = []
for line in diff_out.splitlines():
    if line.startswith('@@') or line.startswith('---') or line.startswith('+++'):
        continue
    if line.startswith('-') or line.startswith('+'):
        stripped = line[1:].strip()
        if not stripped:
            continue
        if stripped in ['[', ']', '],']:
            continue
        if stripped.startswith('"popularBrands"'):
            continue
        if re.match(r'^"[^"]+"\s*,?$', stripped):
            continue
        non_brand_changes.append(line)

print(f"\nNon-brand changes detected in git diff: {len(non_brand_changes)}")
if non_brand_changes:
    for nbc in non_brand_changes[:10]:
        print(f"  SUSPICIOUS CHANGE: {nbc}")
else:
    print("  CONFIRMED: ZERO non-brand changes! Only popularBrands was modified.")
