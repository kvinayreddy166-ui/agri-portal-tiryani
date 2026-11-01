import json
import re
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

def parse_num_range(s):
    s = s.replace('–', '-').replace('—', '-')
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', s)]
    return nums

def format_rate(val):
    if val >= 10:
        return f"{round(val)}"
    elif val >= 1:
        r = round(val, 1)
        return f"{int(r)}" if r.is_integer() else f"{r}"
    elif val >= 0.1:
        r = round(val, 2)
        return f"{r}"
    else:
        return f"{round(val, 3)}"

def translate_to_te(eng):
    if not eng:
        return ""
    if 'Soil application / broadcast' in eng:
        return "భూమిలో నేరుగా వెదజల్లాలి (నీటిలో కలపకూడదు)"
    if 'Seed treatment' in eng:
        return "విత్తన శుద్ధి (విత్తనాల మోతాదును బట్టి కలపాలి)"
    if 'Bait / Fumigant' in eng:
        return "ఎర / పొగబెట్టే విధానం (నీటితో పిచికారీ చేయరాదు)"
    if 'Do not mix with water. Strictly gas-fumigant only' in eng:
        return "నీటితో కలపరాదు. కేవలం వాయు ఫ్యూమిగేషన్ కొరకు మాత్రమే."
    if 'Fumigant' in eng:
        return "పొగబెట్టే మందు (ఫ్యూమిగెంట్) - నీటిలో కలపరాదు."
    if 'Ready to use household' in eng:
        return "గృహ వినియోగ పురుగుమందు. పంట పిచికారీకి నీటిలో కలపరాదు."
    if 'Refer to manufacturer package leaflet' in eng:
        return "తయారీదారు ప్యాకేజీ కరపత్రాన్ని చూడండి"
    if 'Non-spray formulation' in eng or 'Non-spray application' in eng:
        return "పిచికారీ చేయని మందు (ప్యాకేజీ సూచనల ప్రకారం వాడాలి)"

    # Match format: "X ml / Litre (Y ml per 15L knapsack pump)" or "X g / Litre (Y g per 15L knapsack pump)"
    m = re.match(r'^([\d\.\–\-]+)\s*(ml|g|gm)\s*/\s*Litre\s*\(([\d\.\–\-]+)\s*(?:ml|g|gm)\s*per 15L(?:\s*knapsack)?\s*pump\)$', eng)
    if m:
        rate_l = m.group(1)
        unit = 'మి.లీ' if m.group(2) == 'ml' else 'గ్రా'
        rate_pump = m.group(3)
        return f"లీటరు నీటికి {rate_l} {unit} (15 లీటర్ల పంపుకు {rate_pump} {unit})"
    
    return eng

changes = []

for item in items:
    name = item.get('name', '')
    upper_name = name.upper()
    cat = item.get('category', '')
    old_l = item.get('dosagePerLitre', '')
    old_te = item.get('dosagePerLitreTe', '')
    
    # Specific check for Acephate 25% + Fenvalerate 3% EC
    if 'acephate-25-fenvalerate-3-ec' in item['id']:
        new_l = "4.0 ml / Litre (60 ml per 15L knapsack pump)"
        new_te = "లీటరు నీటికి 4.0 మి.లీ (15 లీటర్ల పంపుకు 60 మి.లీ)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        changes.append((item['id'], name, old_l, new_l))
        continue

    # Non-crop / public health / fumigants / rodenticides
    if any(x in upper_name for x in ['ALUMINIUM PHOSPHIDE', 'ALUMINUM PHOSPHIDE', 'ZINC PHOSPHIDE', 'CELPHOS', 'PHOSTEK', 'QUICKPHOS']):
        new_l = "Do not mix with water. Strictly gas-fumigant only."
        new_te = translate_to_te(new_l)
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        if old_l != new_l:
            changes.append((item['id'], name, old_l, new_l))
        continue

    if any(x in upper_name for x in ['BROMADIOLONE', 'COUMATETRALYL', 'BARIUM CARBONATE', 'RODENTICIDE']):
        new_l = "Bait / Fumigant application (Do not spray in water)"
        new_te = translate_to_te(new_l)
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        if old_l != new_l:
            changes.append((item['id'], name, old_l, new_l))
        continue

    if any(x in upper_name for x in ['MOSQUITO', 'COIL', 'VAPORIZER', 'AEROSOL', 'CHALK', 'HOUSEHOLD', 'PUBLIC HEALTH', 'ROACH']):
        new_l = "Ready to use household insecticide. Do not dilute for crop spraying."
        new_te = translate_to_te(new_l)
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        if old_l != new_l:
            changes.append((item['id'], name, old_l, new_l))
        continue

    # Granules & DP (dusting powder)
    if any(x in upper_name for x in [' GR', ' % GR', 'CG', ' DP', ' DUST']):
        new_l = "Soil application / broadcast (Do not dilute in water)"
        new_te = translate_to_te(new_l)
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        if old_l != new_l:
            changes.append((item['id'], name, old_l, new_l))
        continue

    # Seed treatment
    if any(x in upper_name for x in [' FS', ' WS', ' DS']):
        new_l = "Seed treatment slurry (Refer to seed rate)"
        new_te = translate_to_te(new_l)
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        if old_l != new_l:
            changes.append((item['id'], name, old_l, new_l))
        continue

    # For other items with CIB-RC claims
    claims = item.get('cibrcApprovedClaims', [])
    if claims and ('ml / gm per Litre water' in old_l or not old_l or 'Refer to manufacturer' in old_l):
        # Calculate from primary claim
        c = claims[0]
        fd = str(c.get('formulationDosePerHa', '')).strip()
        wv = str(c.get('dilutionWaterPerHa', '')).strip()
        
        # Unit
        unit = 'ml' if any(x in upper_name for x in ['EC', 'SC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV', 'ME']) else 'g'
        
        fd_nums = parse_num_range(fd)
        wv_nums = parse_num_range(wv)
        
        if fd_nums and wv_nums and wv_nums[0] > 0 and fd_nums[0] > 0:
            # Check if fd is reasonable (sometimes header parsing had anomalous strings)
            if fd_nums[0] > 50000: # anomalous
                continue
                
            w_min = wv_nums[0]
            w_max = wv_nums[-1] if len(wv_nums) > 1 else w_min
            f_min = fd_nums[0]
            f_max = fd_nums[-1] if len(fd_nums) > 1 else f_min
            
            # rate per litre
            r_min = f_min / w_max
            r_max = f_max / w_min
            p_min = r_min * 15.0
            p_max = r_max * 15.0
            
            # Validation: rate per litre is typically 0.05 to 10 ml/L
            if 0.01 <= r_min <= 25.0 and 0.01 <= r_max <= 25.0:
                if abs(r_max - r_min) < 0.05 or r_min == r_max:
                    new_l = f"{format_rate(r_min)} {unit} / Litre ({format_rate(p_min)} {unit} per 15L knapsack pump)"
                else:
                    new_l = f"{format_rate(r_min)}–{format_rate(r_max)} {unit} / Litre ({format_rate(p_min)}–{format_rate(p_max)} {unit} per 15L knapsack pump)"
                new_te = translate_to_te(new_l)
                item['dosagePerLitre'] = new_l
                item['dosagePerLitreTe'] = new_te
                changes.append((item['id'], name, old_l, new_l))

print(f"Total changes planned: {len(changes)}")
for ch in changes[:30]:
    print(f"  {ch[0]}: '{ch[2]}' -> '{ch[3]}'")
