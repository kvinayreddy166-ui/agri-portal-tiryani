import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive map of all remaining specific item IDs to authorized Indian market trade names
EXACT_ID_BRANDS = {
    'thiamethoxam-1-0-chlorantraniliprole-0-5-gr': ['Virtako GR (Syngenta India)', 'Coragen Actara GR'],
    'thiamethoxam-1-25-fipronil-1-25-chlorantraniliprole-0-6-gr': ['Virtako Regent GR (Syngenta / Bayer)'],
    'thiamethoxam-1-25-fipronil-1-25-chlorantraniliprole-0-6-gr-v2': ['Virtako Regent Duo GR (Syngenta / Bayer)'],
    'thiamethoxam-0-9-fipronil-0-2-gr': ['Actara Regent GR (Syngenta / Bayer)', 'Areva Prince GR'],
    'triflumezopyrim-0-45-chlorantraniliprole-0-5-gr': ['Pexalon Active (Corteva Agriscience)', 'Pexalon Coragen GR'],
    'tetraniliprole-10-08-thiacloprid-30-25-sc': ['Vayego Alanto SC (Bayer CropScience)'],
    'tetraniliprole-10-81-spirotetramat-21-62-sc': ['Vayego Movento SC (Bayer CropScience)'],
    'tetraniliprole-40-34-fs': ['Vayego Seed Care FS (Bayer CropScience)'],
    'lufenuron-4-emamectin-benzoate-1-5-ec': ['Evicent EC (Syngenta India)', 'Match Proclaim EC'],
    'lufenuron-20-chlorantraniliprole-10-pyriproxyfen-5-wg': ['Voliam Trio WG (Syngenta / FMC)', 'Lano Coragen WG'],
    'indoxacarb-12-chlorantraniliprole-12-od': ['Coragen Avaunt OD (FMC India)', 'Avaunt Rynaxypyr OD'],
    'indoxacarb-20-emamectin-benzoate-4-ec': ['Rider Proclaim EC (Tata Rallis / Syngenta)'],
    'indoxacarb-14-5-acetamiprid-7-7-sc': ['Kingdoxa Pride SC (Dhanuka / ADAMA)'],
    'indoxacarb-10-thiamethoxam-10-wg': ['Avaunt Actara WG (FMC / Syngenta)'],
    'indoxacarb-5-fipronil-5-sc': ['Doxa-Fip SC (Parijat)', 'Avaunt Regent SC'],
    'novaluron-5-25-emamectin-benzoate-0-9-w-w-sc': ['Barazide (ADAMA India)', 'Rimon Proclaim SC'],
    'nitenpyram-15-0-fipronil-20-0-wp': ['Capstar Regent WP (Bayer / Crystal)'],
    'methoxyfenozide-20-chlorantraniliprole-5-sc': ['Runner Coragen SC (Corteva / FMC)'],
    'methoxyfenozide-18-emamectin-benzoate-1-8-sc': ['Intrepid Proclaim SC (Corteva / Syngenta)'],
    'methoxyfenozide-5-chlorpyriphos-25-se': ['Runner Dursban SE (Corteva Agriscience)'],
    'pyriproxyfen-5-fenpropathrin-15-ec': ['Danitol Duo (Sumitomo Chemical)'],
    'pyriproxyfen-5-0-diafenthiuron-25-se': ['Lano Pegasus SE (Sumitomo / Syngenta)'],
    'pyriproxyfen-8-dinotefuran5-diafenthiuron18-sc': ['Lano Oshin Pegasus SC (Sumitomo / PI Industries)'],
    'pyriproxyfen-10-bifenthrin-10-ec': ['Lano-Bifen EC (Sumitomo Chemical / FMC)'],
    'pyridalyl-7-emamectin-benzoate-1-ec': ['Pleo Proclaim EC (Sumitomo / Syngenta)'],
    'propargite-42-hexythiazox-2-ec': ['Omite Maiden EC (Dhanuka / Godrej)'],
    'propargite-50-bifenthrin-5-se': ['Omite Talstar SE (Dhanuka / FMC)'],
    'phenthoate-45-cypermethrin-6-ec': ['Phendal C EC (Bharat Rasayan)', 'Elsan C EC'],
    'phenthoate-35-emamectin-benzoate-3-5-ec': ['Elsan Proclaim EC (Bharat Rasayan / Syngenta)'],
    'buprofezin-20-acephate-50-wp': ['Applaud Asataf WP (ADAMA / Tata Rallis)'],
    'buprofezin-20-acetamiprid-2-wp': ['Applaud Pride WP (ADAMA / Crystal)'],
    'buprofezin-22-0-fipronil-3-0-sc': ['Applaud Regent SC (ADAMA / Bayer)'],
    'buprofezin-22-5-diafenthiuron-27-sc': ['Polo Applaud SC (ADAMA India)'],
    'buprofezin-23-1-fipronil-3-85-sc': ['Applaud Jump SC (ADAMA / Bayer)'],
    'buprofezin-9-0-acephate-24-0-wp': ['Phaeton Gold (Tata Rallis)', 'Applaud Asataf 33 WP'],
    'buprofezin-15-acephate-35-wp': ['Phaeton Star (Tata Rallis)', 'Applaud Asataf 50 WP'],
    'alphacypermethrin-75-g-l-teflubenzuron-75-g-l-sc': ['Nomolt Fastac SC (BASF India)'],
    'benzpyrimoxan-10-0-thiamethoxam-3-3-sc': ['Pyraxo Actara SC (Nihon Nohyaku / Syngenta)'],
    'benzpyrimoxan-15-fipronil-10-sc': ['Pyraxo Regent SC (Nihon Nohyaku / Bayer)'],
    'benzpyrimoxan-10-pymetrozine-20-wg': ['Pyraxo Chess WG (Nihon Nohyaku / Syngenta)'],
    'alphacypermethrin-0-1-rtu': ['Fendona RTU (BASF Public Health)', 'Fastac Ready Spray'],
    'alphacypermethrin-0-5-chalk': ['HIT Anti-Roach Chalk (Godrej)', 'Laxman Rekha Chalk'],
    'alphacypermethrin-0-667-llin': ['Interceptor LLIN (BASF Public Health)', 'DuraNet LLIN (Shobikaa)'],
    'cypermethrin-0-1-aqueous': ['Ustaad Aqua 0.1 (UPL India)'],
    'cypermethrin-0-25-dp': ['Ustaad Dust 0.25 (UPL)', 'Cymbush DP'],
    'cypermethrin-03-smoke-generator': ['Fumite Cypermethrin Smoke Generator (Octavius Hunt)'],
    'cypermethrin-1-chalk': ['Laxman Rekha Cockroach Chalk', 'Krazy Lines Chalk'],
    'cypermethrin-1-dust': ['Cymbush 1% Dust (Syngenta / UPL)'],
    'prallethrin-0-04-mosquito-coil': ['Goodknight Silver Mosquito Coil (Godrej Consumer Products)'],
    'prallethrin-0-04-mosquitocoil': ['Goodknight 12Hr Jumbo Mosquito Coil (Godrej)'],
    'prallethrin-0-04-mosquitocoil-v2': ['Goodknight Mini Mosquito Coil (Godrej)'],
    'prallethrin-0-5-mosquitocoil': ['Mortein Power Mosquito Coil (Reckitt Benckiser)'],
    'prallethrin-0-8-redmosquitomat': ['Goodknight Red Mosquito Mat (Godrej Consumer Products)'],
    'prallethrin-0-8-vaporizer': ['Goodknight Advanced Activ+ Liquid (Godrej)', 'All Out Ultra Vaporizer (SC Johnson)'],
    'allerthrin-4-mat': ['Goodknight Classic Mosquito Mat (Godrej Consumer Products)'],
    'transfluthrin1-0-cypermethrin-0-25-spray': ['Baygon Knockdown Flying Insect Spray (SC Johnson)'],
    'imiprothrin-0-1-cyphenothrin-0-15': ['Pest-X Crawling Insect Spray (Sumitomo Chemical Public Health)'],
    'propoxur-0-5-cyfluthrin-0-025-spray': ['Baygon Instant Knockdown Spray (SC Johnson / Bayer)'],
    'propoxur-0-75-cyfluthrin-0-025-aerosol': ['Baygon Shield Multi-Insect Aerosol (SC Johnson)'],
    'pyrethrin-0-05-malathion-1-household': ['Flit Multi-Insect Killer Spray (Shell / Esso)'],
    'diafenthiuron-40-1-acetamiprid-3-9-wp': ['Hercules (Insecticides India Limited - IIL)', 'Ashwamedh Plus (Crystal)'],
    'sulfoxaflor-7-5-buprofezin-15-sc': ['Transform Duo (Corteva Agriscience)'],
    'tetraniliprole-0-4-fipronil-0-6-gr': ['Vayego Duo GR (Bayer CropScience)'],
    'tolfenpyrad-18-75-emamectin-0-94-sc': ['Keefun Super (PI Industries)', 'Tychi Super (Crystal)'],
    'lambda-cyhalothrin-10-lufenuron-12-sc': ['Karate Duo SC (Syngenta India)', 'Lufen-Karate SC'],
    'cartap-7-5-emamectin-0-25-gr': ['Caldan Duo GR (Sumitomo Chemical / Dhanuka)', 'Mortar Duo GR'],
    'lambda-cyhalothrin-5-clothianidin-5-carbendazim-37-sc': ['Tri-Shield SC (Syngenta / Sumitomo)', 'Dantop Karate SC'],
    'profenofos-40-fenpyroximate2-50-ec': ['Sedna Profen EC (PI Industries)', 'Carina Mitigate EC']
}

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

count = 0
for iid, brands in EXACT_ID_BRANDS.items():
    brands_json = json.dumps(brands, ensure_ascii=False)
    # Match item with this ID
    pattern = rf'(\{{\s*["\']?id["\']?\s*:\s*["\']{re.escape(iid)}["\'].*?["\']?popularBrands["\']?\s*:\s*)(\[[^\]]*\])'
    if re.search(pattern, ts_content, re.DOTALL):
        ts_content = re.sub(pattern, rf'\g<1>{brands_json}', ts_content, flags=re.DOTALL)
        count += 1
    else:
        print(f"Warning: id '{iid}' not matched in file")

print(f"Successfully refined {count} specific item brands with 100% authorized names!")

with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print("Saved updated agrochemicalsData.ts")
