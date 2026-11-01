import re
import sys
from canonical_actives import ACTIVES_DB

sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/genuinely_missing_v2.txt', 'r', encoding='utf-8') as f:
    missing = [l.strip().split('\t') for l in f if l.strip()]

def find_active(text):
    text_lower = text.lower()
    # Normalize common synonyms
    text_lower = text_lower.replace('chlorpyriphos', 'chlorpyrifos')
    text_lower = text_lower.replace('betacyfluthrin', 'beta_cyfluthrin').replace('beta-cyfluthrin', 'beta_cyfluthrin')
    text_lower = text_lower.replace('alphacypermethrin', 'alphacypermethrin')
    text_lower = text_lower.replace('lambdacyhalothrin', 'lambda_cyhalothrin').replace('lambda-cyhalothrin', 'lambda_cyhalothrin').replace('lambda cyhalothrin', 'lambda_cyhalothrin')
    text_lower = text_lower.replace('aluminium phosphide', 'aluminium_phosphide').replace('aluminum phosphide', 'aluminium_phosphide').replace('aluminiumphosphide', 'aluminium_phosphide')
    text_lower = text_lower.replace('zinc phosphide', 'zinc_phosphide')
    text_lower = text_lower.replace('barium carbonate', 'barium_carbonate')
    text_lower = text_lower.replace('cartap hydrochloride', 'cartap_hydrochloride').replace('cartaphydrochloride', 'cartap_hydrochloride')
    text_lower = text_lower.replace('emamectin benzoate', 'emamectin_benzoate').replace('emamectinbenzoate', 'emamectin_benzoate')
    text_lower = text_lower.replace('d-trans-allethrin', 'allethrin').replace('d-transallethrin', 'allethrin').replace('allerthrin', 'allethrin').replace('s-bioallethrin', 'allethrin')
    text_lower = text_lower.replace('fenobucarb', 'fenobucarb').replace('bpmc', 'fenobucarb')
    text_lower = text_lower.replace('thiocyclam hydrogen oxalate', 'thiocyclam')
    text_lower = text_lower.replace('pirimiphos-methyl', 'pirimiphos_methyl').replace('pirimiphosmethyl', 'pirimiphos_methyl')
    text_lower = text_lower.replace('oxydemeton-methyl', 'oxydemeton_methyl')
    text_lower = text_lower.replace('tebufenpyrad', 'tebufenpyrad')
    text_lower = text_lower.replace('cyenopyrafen', 'cyenopyrafen')
    text_lower = text_lower.replace('pyribenzoxim', 'pyribenzoxim')
    text_lower = text_lower.replace('pyrethrin', 'pyrethrin')
    text_lower = text_lower.replace('propetamphos', 'propetamphos')
    text_lower = text_lower.replace('didinotefuran', 'dinotefuran')
    text_lower = text_lower.replace('chlorantraniliprorle', 'chlorantraniliprole').replace('chlorantraniliporle', 'chlorantraniliprole')

    matched_keys = []
    for k in ACTIVES_DB:
        if k in text_lower or k.replace('_', ' ') in text_lower or k.replace('_', '') in text_lower:
            matched_keys.append(k)
    return matched_keys

unmatched_actives = []
for itype, num, name in missing:
    matches = find_active(name)
    if not matches:
        unmatched_actives.append((itype, num, name))

print(f'Total missing: {len(missing)}')
print(f'Matched at least one active: {len(missing) - len(unmatched_actives)}')
print(f'Zero active matched: {len(unmatched_actives)}')

if unmatched_actives:
    print('\nUnmatched items:')
    for u in unmatched_actives[:20]:
        print(f'  {u[0]} {u[1]}: {u[2]}')
