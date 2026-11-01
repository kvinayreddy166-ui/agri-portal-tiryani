import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

ts_file = 'project/src/features/agrochemicals/data/agrochemicalsData.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    text = f.read()

start_pos = text.find('=\n[')
if start_pos == -1:
    start_pos = text.find('= [')
start_pos = text.find('[', start_pos)
end_pos = text.rfind(']') + 1

header = text[:start_pos]
items = json.loads(text[start_pos:end_pos])
footer = text[end_pos:]

def parse_num_range(s):
    s_clean = re.sub(r'\d+(?:\.\d+)?\s*%', '', s)
    s_clean = s_clean.replace('–', '-').replace('—', '-')
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', s_clean)]
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
    if 'Termiticide' in eng:
        return "చెదపురుగుల నివారణ మందు - లేబుల్ సూచనల ప్రకారం వాడాలి (పంటలపై పిచికారీ చేయరాదు)"
    if 'Public health' in eng:
        return "ప్రజారోగ్య దోమల/కీటకాల నియంత్రణ మందు. పంట పిచికారీకి కాదు."
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

updated_count = 0

for item in items:
    name = item.get('name', '')
    upper_name = name.upper()
    old_l = item.get('dosagePerLitre', '')
    old_te = item.get('dosagePerLitreTe', '')
    item_id = item.get('id', '')

    # 1. Exact fix for Acephate 25% + Fenvalerate 3% EC
    if item_id == 'acephate-25-fenvalerate-3-ec':
        new_l = "4.0 ml / Litre (60 ml per 15L knapsack pump)"
        new_te = "లీటరు నీటికి 4.0 మి.లీ (15 లీటర్ల పంపుకు 60 మి.లీ)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = new_te
        updated_count += 1
        continue

    # 2. Skip items that already have high-precision pump or specialized guidance
    if 'per 15L' in old_l and '1.5 - 2.0 ml / gm' not in old_l and '1.0 - 2.0 ml / gm' not in old_l:
        continue
    if any(x in old_l for x in ['gas-fumigant only', 'household insecticide', 'Granular Broadcast', 'Soil Granule Application', 'Seed Slurry', 'Dry Bait']):
        continue

    # 3. Termiticides & Fumigants & Rodenticides & Public Health
    if any(x in upper_name for x in ['ALUMINIUM PHOSPHIDE', 'ALUMINUM PHOSPHIDE', 'ZINC PHOSPHIDE', 'CELPHOS', 'PHOSTEK', 'QUICKPHOS', 'METHYL BROMIDE', 'ETHYLENE DICHLORIDE']):
        new_l = "Do not mix with water. Strictly gas-fumigant only."
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    if any(x in upper_name for x in ['BROMADIOLONE', 'COUMATETRALYL', 'BARIUM CARBONATE', 'RODENTICIDE']):
        new_l = "Bait / Fumigant application (Do not spray in water)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    if 'TERMITICIDE' in upper_name or item_id in ['fipronil-2-92-ec', 'chlorpyrifos-20-ec-termite', 'imidacloprid-30-5-sc-termite']:
        new_l = "Termiticide - Dilute as per BIS 6313 / label instructions (Do not spray on crops)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    if any(x in upper_name for x in ['MOSQUITO', 'COIL', 'VAPORIZER', 'AEROSOL', 'CHALK', 'HOUSEHOLD', 'PUBLIC HEALTH', 'ROACH', 'FLY BAIT']):
        new_l = "Ready to use household insecticide. Do not dilute for crop spraying."
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    # Pure Granules & Dusts (not combined with EC/SC)
    if (upper_name.endswith(' GR') or ' % GR' in upper_name or ' % W/W GR' in upper_name or upper_name.endswith(' CG') or upper_name.endswith(' DP') or ' DUST' in upper_name) and not ('EC' in upper_name or 'SC' in upper_name or 'SP' in upper_name or 'WP' in upper_name):
        new_l = "Soil application / broadcast (Do not dilute in water)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    # Pure Seed treatments
    if (upper_name.endswith(' FS') or upper_name.endswith(' WS') or upper_name.endswith(' DS')) and not ('EC' in upper_name or 'SC' in upper_name):
        new_l = "Seed treatment slurry (Refer to seed rate)"
        item['dosagePerLitre'] = new_l
        item['dosagePerLitreTe'] = translate_to_te(new_l)
        updated_count += 1
        continue

    # 4. Formulations with CIB-RC claims
    claims = item.get('cibrcApprovedClaims', [])
    if claims and ('ml / gm per Litre water' in old_l or not old_l or 'Refer to manufacturer' in old_l):
        c = claims[0]
        fd = str(c.get('formulationDosePerHa', '')).strip()
        wv = str(c.get('dilutionWaterPerHa', '')).strip()
        
        # Unit
        unit = 'ml' if any(x in upper_name for x in ['EC', 'SC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV', 'ME']) else 'g'
        
        fd_nums = parse_num_range(fd)
        wv_nums = parse_num_range(wv)
        
        if fd_nums and wv_nums and wv_nums[0] > 0 and fd_nums[0] > 0:
            if fd_nums[0] > 50000:
                continue
                
            w_min = wv_nums[0]
            w_max = wv_nums[-1] if len(wv_nums) > 1 else w_min
            f_min = fd_nums[0]
            f_max = fd_nums[-1] if len(fd_nums) > 1 else f_min
            
            if f_min > f_max: f_min, f_max = f_max, f_min
            if w_min > w_max: w_min, w_max = w_max, w_min
            
            r_min = f_min / w_max
            r_max = f_max / w_min
            p_min = r_min * 15.0
            p_max = r_max * 15.0
            
            # Reasonable crop spraying rate range (0.02 to 20 ml or g / L)
            if 0.01 <= r_min <= 20.0 and 0.01 <= r_max <= 20.0:
                if abs(r_max - r_min) < 0.05 or r_min == r_max:
                    new_l = f"{format_rate(r_min)} {unit} / Litre ({format_rate(p_min)} {unit} per 15L knapsack pump)"
                else:
                    new_l = f"{format_rate(r_min)}–{format_rate(r_max)} {unit} / Litre ({format_rate(p_min)}–{format_rate(p_max)} {unit} per 15L knapsack pump)"
                item['dosagePerLitre'] = new_l
                item['dosagePerLitreTe'] = translate_to_te(new_l)
                updated_count += 1
            else:
                new_l = "Refer to manufacturer package leaflet"
                item['dosagePerLitre'] = new_l
                item['dosagePerLitreTe'] = translate_to_te(new_l)
                updated_count += 1
        else:
            new_l = "Refer to manufacturer package leaflet"
            item['dosagePerLitre'] = new_l
            item['dosagePerLitreTe'] = translate_to_te(new_l)
            updated_count += 1

print(f"Updated {updated_count} items.")

# Write back
with open(ts_file, 'w', encoding='utf-8') as f:
    f.write(header + json.dumps(items, indent=2, ensure_ascii=False) + footer)

print(f"Successfully wrote changes to {ts_file}")
