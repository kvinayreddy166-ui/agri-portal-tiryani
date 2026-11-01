import re

def convert_ha_to_acre(dose_str):
    if not dose_str or not dose_str.strip():
        return ""
    dose_str = dose_str.strip()
    
    # If it's a percentage (e.g. 0.025-0.050% or 0.1%), dilution percentage remains identical
    if '%' in dose_str:
        return f"{dose_str} (spray concentration)"
    
    # If it has ranges, e.g. "500 - 1000 ml" or "60 - 80 g" or "1.5 - 2.0 kg"
    # Find all numbers and their units
    matches = re.findall(r'(\d+(?:\.\d+)?)\s*(-|to|–)?\s*(\d+(?:\.\d+)?)?\s*(ml|g|kg|l|gm|ltr|litres|liters)?', dose_str, re.IGNORECASE)
    
    # Let's extract unit
    unit_m = re.search(r'(ml|kg|gm|g\b|l\b|ltr)', dose_str, re.IGNORECASE)
    unit = unit_m.group(1).lower() if unit_m else ''
    if unit == 'gm': unit = 'g'
    if unit in ['l', 'ltr']: unit = 'L'
    
    nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', dose_str)]
    if not nums:
        return dose_str
        
    converted_nums = []
    for n in nums:
        c = n / 2.47105
        # Round nicely
        if c >= 100:
            converted_nums.append(f"{round(c)}")
        elif c >= 10:
            # If close to integer, round
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
            
    if len(converted_nums) == 1:
        res = f"{converted_nums[0]} {unit}/acre" if unit else f"{converted_nums[0]}/acre"
    elif len(converted_nums) == 2:
        res = f"{converted_nums[0]}-{converted_nums[1]} {unit}/acre" if unit else f"{converted_nums[0]}-{converted_nums[1]}/acre"
    else:
        res = f"{converted_nums[0]} {unit}/acre"
    return f"{res} (calc. from {dose_str}/ha)"

test_cases = [
    "60 g", "80 g", "150 ml", "1000 ml", "500 - 1000 ml", "100-120 g", "7.5 kg", "2.5 - 3.0 kg", "0.025-0.050%"
]
for tc in test_cases:
    print(f"'{tc}' --> '{convert_ha_to_acre(tc)}'")
