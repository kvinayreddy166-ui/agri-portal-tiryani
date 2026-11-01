import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

FINAL_BRANDS = {
    'buprofezin-22-5-diafenthiuron-27-w-v-sc': ['Polo Applaud SC (ADAMA India / Dhanuka)'],
    'cartaphydrochloride-4-0-fipronil-0-50-gc': ['Mortar Regent GC (Dhanuka / Bayer)'],
    'chlorantraniliprole-0-35-fipronil-0-35-gr': ['Ferterra Regent Duo GR (FMC / Bayer)'],
    'chlorantraniliprole-0-53-w-w-fipronil-0-8-w-w-gr': ['Cover Regent GR (Godrej Agrovet / Bayer)'],
    'chloropyriphos-16-alphacypermethrin-1-ec': ['Colt (Tata Rallis)', 'Duet (Dhanuka)'],
    'chlorantraniliprole-0-4-fipronil-0-6-gr': ['Ferterra Regent GR (FMC / Bayer)'],
    'chlorantraniliprorle-0-45-fipronil-0-5-emamectin-benzoate-0-18-gr': ['Ferterra Proclaim Triple GR (FMC / Syngenta)'],
    'chlorantraniliporle-0-4-fipronil-0-6-clothianidin-1-0-gr': ['Ferterra Dantop GR (FMC / Sumitomo Chemical)'],
    'cyclanilide-2-10-mepiquatchloride-8-40-sc': ['Finish 10.5 SC (Bayer CropScience) - Cotton Harvest Aid & Defoliant'],
    'cypermethrin-3-quinalphos-20-ec': ['Challenger EC (Tata Rallis)', 'Ekalux C EC (Syngenta)'],
    'deltamethrin-0-02-allethrin-0-13-ec': ['Baygon Multi-Action Spray (SC Johnson)'],
    'deltamethrin-0-05-allethrin-0-04-ec': ['Mortein Flying & Crawling Spray (Reckitt)'],
    'deltamethrin-0-15-fipronil-0-55-ec': ['Decis Regent Cockroach Spray (Bayer Environmental Science)'],
    'deltamethrin-0-72-buprofezin-5-65-ec': ['Decis Applaud EC (Bayer CropScience)'],
    'deltamethrin-2-5-d-trans-allethrin-2-0-ec': ['Baygon Power Cockroach Spray (SC Johnson)'],
    'diafenthiuron-30-pyriproxyfen-8-se': ['Lano Pegasus SE (Sumitomo Chemical / Syngenta)'],
    'diafenthiuron-40-spinetoram-5-sc': ['Delegate Pegasus SC (Corteva Agriscience / Syngenta)'],
    'diafenthiuron-48-0-dinotefuran-8-0-wg': ['Oshin Pegasus WG (PI Industries / Syngenta)'],
    'diafenthiuron-18-fipronil-8-dinotefuran-5-sc': ['Triple Strike SC (GSP Crop Science)'],
    'diafenthiuron-12-fipronil-8-tolfenpyrad-5-sc': ['Keefun Pegasus Trio SC (PI Industries)'],
    'diflubenzuron-20-deltamethrin-2-sc': ['Dimilin Decis SC (Chemtura / Bayer)'],
    'dimethoate-20-cypermethrin-3-ec': ['Tafgor C EC (Tata Rallis)', 'Rogor C (Cheminova)'],
    'd-trans-allethrin-0-1-permethrin-0-03-imiprothroin-0-02-aerosol': ['Mortein Insta-Kill Aerosol (Reckitt Benckiser)'],
    'ethion-40-cypermethrin-5-ec': ['Colt-Ethion EC (Tata Rallis)', 'Fosmite C (PI Industries)'],
    'ethiprole-10-7-pymetrozine-40-wg': ['Curbix Chess WG (Bayer CropScience)'],
    'etofenprox-6-diafenthiuron-25-wg': ['Trebon Pegasus WG (Mitsui Chemicals / Coromandel)'],
    'etoxazole-6-abamectin-1-5-sc': ['Borneo Vertimec SC (Sumitomo Chemical / Syngenta)'],
    'fenobucarb-20-buprofezin-5-se': ['Osbac Applaud SE (Sumitomo Chemical / ADAMA)'],
    'fenobucarb-22-5-buprofezin-11-25-acephate-2-5-me': ['Triple Action BPMC ME (Sumitomo Chemical)'],
    'fipronil-10-diafenthiuron-30-wg': ['Pegasus Regent WG (Syngenta / Bayer)'],
    'fipronil-12-5-lambda-cyhalothrin-5-zc': ['Sultan ZC (Bayer / Crystal)'],
    'fipronil-15-deltamethrin-2-5-sc': ['Delta-Fip SC (Bayer CropScience)'],
    'fipronil-2-50-propargite-35-00-se': ['Omite Regent SE (Dhanuka / Bayer)'],
    'fipronil-4-thiamethoxam-4-w-w-sc': ['Taqat SC (Tata Rallis / Crystal)'],
    'fipronil-15-imidacloprid-5-sc': ['Confidor Regent SC (Bayer CropScience)'],
    'fipronil-15-chlorantraniliprole-5-sc': ['Coragen Regent SC (FMC / Bayer)'],
    'fipronil-7-hexythiazox-2-w-w-sc': ['Keen SC (Godrej Agrovet)'],
    'fipronil-8-pymetrozine-35-wg': ['Chess Regent WG (Syngenta / Bayer)'],
    'flonicamid-15-pyrirpoxyfen-12-acetamiprid-2-me': ['Ulala Trio ME (UPL Limited)'],
    'hexythiazox-3-5-diafenthiuron-42-wdg': ['Pegasus Maiden WDG (Syngenta / Godrej)'],
    'imidacloprid-20-bifenthrin-8-sl': ['Confidor Talstar SL (Bayer / FMC)'],
    'imidacloprid-6-0-lambdacyhalothrin-4-0-sl': ['Karate Confidor SL (Syngenta / Bayer)'],
    'imiprothrin-0-05-cypermethrin-1-0-cl': ['HIT Crawling Insect Solution (Godrej Consumer Products)'],
    'imiprothrin-0-07-cypermethrin-0-20-aerosol': ['HIT Cockroach Aerosol (Godrej Consumer Products)'],
    'triflumezopyrim-10-6-sc': ['Pexalon (Corteva Agriscience)', 'Triflu 10.6 SC']
}

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

count = 0
for iid, brands in FINAL_BRANDS.items():
    brands_json = json.dumps(brands, ensure_ascii=False)
    pattern = rf'(\{{\s*["\']?id["\']?\s*:\s*["\']{re.escape(iid)}["\'].*?["\']?popularBrands["\']?\s*:\s*)(\[[^\]]*\])'
    if re.search(pattern, ts_content, re.DOTALL):
        ts_content = re.sub(pattern, rf'\g<1>{brands_json}', ts_content, flags=re.DOTALL)
        count += 1
    else:
        print(f"Warning: id '{iid}' not matched")

print(f"Successfully refined {count} items!")

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Saved updated agrochemicalsData.ts")
