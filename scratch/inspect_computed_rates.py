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
    # Match numbers like 500 - 750, or 2000, or 0.5
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

for item in items:
    dose_l = item.get('dosagePerLitre', '')
    if 'ml / gm per Litre water' not in dose_l:
        continue
    claims = item.get('cibrcApprovedClaims', [])
    if not claims:
        continue
    
    # Let's inspect first claim
    c = claims[0]
    fd = str(c.get('formulationDosePerHa', ''))
    wv = str(c.get('dilutionWaterPerHa', ''))
    acre = str(c.get('calculatedDosePerAcre', ''))
    name = item['name']
    upper_name = name.upper()
    
    # Determine unit
    unit = 'ml' if any(x in upper_name for x in ['EC', 'SC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV', 'ME']) else 'g'
    if any(x in upper_name for x in ['GR', 'CG', 'TABLET', 'TAB', 'POWDER', 'BAIT', 'GEL', 'RB', 'CB', 'DP']):
        if any(x in upper_name for x in ['GR', 'CG', 'DP']):
            computed = "Soil application / broadcast (Do not dilute in water)"
        elif any(x in upper_name for x in ['FS', 'WS', 'DS']):
            computed = "Seed treatment slurry (Refer to seed rate)"
        elif any(x in upper_name for x in ['TAB', 'TABLET', 'POWDER', 'BAIT', 'RB', 'CB']):
            computed = "Bait / Fumigant application (Do not spray in water)"
        else:
            computed = "Non-spray application"
    else:
        fd_nums = parse_num_range(fd)
        wv_nums = parse_num_range(wv)
        if fd_nums and wv_nums and wv_nums[0] > 0:
            # Low and high
            w_min = wv_nums[0]
            w_max = wv_nums[-1] if len(wv_nums) > 1 else w_min
            f_min = fd_nums[0]
            f_max = fd_nums[-1] if len(fd_nums) > 1 else f_min
            
            # rate per litre
            r_min = f_min / w_max
            r_max = f_max / w_min
            
            p_min = r_min * 15.0
            p_max = r_max * 15.0
            
            if abs(r_max - r_min) < 0.05 or r_min == r_max:
                computed = f"{format_rate(r_min)} {unit} / Litre ({format_rate(p_min)} {unit} per 15L knapsack pump)"
            else:
                computed = f"{format_rate(r_min)}–{format_rate(r_max)} {unit} / Litre ({format_rate(p_min)}–{format_rate(p_max)} {unit} per 15L knapsack pump)"
        else:
            computed = "Refer to manufacturer package leaflet"
            
    print(f"[{item['id']}] {name}:")
    print(f"   FormDose: {fd} | Water: {wv} | Acre: {acre}")
    print(f"   OLD: {dose_l}")
    print(f"   NEW: {computed}\n")
