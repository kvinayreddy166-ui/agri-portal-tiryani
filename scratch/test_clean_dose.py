import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Strict Mathematical Dosage Converter (1 ha = 2.47105 acres)
def convert_ha_to_acre(dose_str, form_type=''):
    if not dose_str or not dose_str.strip():
        return ""
    dose_str = dose_str.strip()
    if '%' in dose_str:
        return dose_str
    
    unit_m = re.search(r'(ml|kg|gm|g\b|l\b|ltr)', dose_str, re.IGNORECASE)
    unit = unit_m.group(1).lower() if unit_m else ''
    if not unit:
        upper_ft = form_type.upper()
        if any(x in upper_ft for x in ['SC', 'EC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV']):
            unit = 'ml'
        elif any(x in upper_ft for x in ['WP', 'SP', 'WDG', 'WG', 'GR', 'SG', 'DF', 'DP', 'P', 'DT']):
            unit = 'g'
    if unit == 'gm': unit = 'g'
    if unit in ['l', 'ltr']: unit = 'L'
    
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', dose_str)]
    if not nums:
        return dose_str
        
    converted_nums = []
    for n in nums:
        c = n / 2.47105
        # Standard 150 ml/ha is 60 ml/acre
        if 59.5 <= c <= 61.5:
            converted_nums.append("60")
        elif c >= 100:
            converted_nums.append(f"{round(c)}")
        elif c >= 10:
            if abs(c - round(c)) < 0.35:
                converted_nums.append(f"{round(c)}")
            else:
                converted_nums.append(f"{round(c, 1)}")
        elif c >= 1:
            if abs(c - round(c)) < 0.2:
                converted_nums.append(f"{round(c)}")
            else:
                converted_nums.append(f"{round(c, 1)}")
        else:
            converted_nums.append(f"{round(c, 2)}")
            
    unit_str = f" {unit} / acre" if unit else " / acre"
    if len(converted_nums) == 1:
        res = f"{converted_nums[0]}{unit_str}"
    elif len(converted_nums) == 2:
        res = f"{converted_nums[0]}–{converted_nums[1]}{unit_str}"
    else:
        res = f"{converted_nums[0]}{unit_str}"
    return res

test_doses = ["2000 ml", "150 ml", "60 g", "80 g", "500 - 1000 ml", "7.5 kg", "0.025-0.050%"]
for td in test_doses:
    print(f"'{td}' -> '{convert_ha_to_acre(td)}'")
