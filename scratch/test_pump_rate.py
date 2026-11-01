import re

def compute_dosage_per_litre(form_dose_str, water_str, form_type=''):
    if not form_dose_str or not water_str:
        return ""
    
    # If water is '-' or granulate/bait/fumigant
    upper_ft = form_type.upper()
    if any(x in upper_ft for x in ['GR', 'BAIT', 'POWDER', 'TAB', 'COIL', 'MAT', 'VAPORIZER', 'GEL']):
        if any(x in upper_ft for x in ['GR', 'CG']):
            return "Soil application / broadcast (Do not dilute in water)"
        if 'FS' in upper_ft or 'WS' in upper_ft:
            return "Seed treatment slurry (Refer to seed rate)"
        return "Non-spray formulation (Apply as per package instructions)"
        
    # Extract unit of formulation
    unit_m = re.search(r'(ml|kg|gm|g\b|l\b|ltr)', form_dose_str, re.IGNORECASE)
    unit = unit_m.group(1).lower() if unit_m else ''
    if not unit:
        if any(x in upper_ft for x in ['SC', 'EC', 'SL', 'OD', 'CS', 'FS', 'EW', 'SE', 'DC', 'ULV']):
            unit = 'ml'
        elif any(x in upper_ft for x in ['WP', 'SP', 'WDG', 'WG', 'SG', 'DF', 'DP']):
            unit = 'g'
    if unit == 'gm': unit = 'g'
    
    # Parse numbers from form_dose
    form_nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', form_dose_str)]
    # Parse water numbers
    water_nums = [float(x) for x in re.findall(r'\d+(?:\.\d+)?', water_str)]
    
    if not form_nums or not water_nums:
        return ""
        
    water_vol = water_nums[0] # primary water volume in L/ha (e.g. 500)
    if water_vol <= 0:
        return ""
        
    rates_per_l = []
    rates_per_pump = []
    
    for fn in form_nums:
        # If dose is in kg, convert to g
        if unit == 'kg':
            fn = fn * 1000
            unit = 'g'
        rate_l = fn / water_vol
        rate_pump = rate_l * 15.0
        
        # Round nicely
        if rate_l >= 10:
            rates_per_l.append(f"{round(rate_l)}")
        elif rate_l >= 1:
            rates_per_l.append(f"{round(rate_l, 1)}" if abs(rate_l - round(rate_l)) > 0.1 else f"{round(rate_l)}")
        elif rate_l >= 0.1:
            rates_per_l.append(f"{round(rate_l, 2)}" if abs(rate_l - round(rate_l, 1)) > 0.02 else f"{round(rate_l, 1)}")
        else:
            rates_per_l.append(f"{round(rate_l, 3)}")
            
        if rate_pump >= 10:
            rates_per_pump.append(f"{round(rate_pump)}")
        elif rate_pump >= 1:
            rates_per_pump.append(f"{round(rate_pump, 1)}" if abs(rate_pump - round(rate_pump)) > 0.1 else f"{round(rate_pump)}")
        else:
            rates_per_pump.append(f"{round(rate_pump, 2)}")
            
    if len(rates_per_l) == 1:
        res_l = f"{rates_per_l[0]} {unit} / Litre"
        res_pump = f"{rates_per_pump[0]} {unit}"
    else:
        res_l = f"{rates_per_l[0]}–{rates_per_l[1]} {unit} / Litre"
        res_pump = f"{rates_per_pump[0]}–{rates_per_pump[1]} {unit}"
        
    return f"{res_l} ({res_pump} per 15L knapsack pump)"

test_cases = [
    ("2000", "500", "Acephate 25%+ Fenvalerate 3% EC"),
    ("150", "500", "Chlorantraniliprole 18.5% SC"),
    ("60", "500", "Emamectin Benzoate 5% + Lufenuron 40% WG"),
    ("80", "500", "Emamectin Benzoate 5% + Lufenuron 40% WG"),
    ("1000 - 1500", "500", "Fipronil 5% SC"),
    ("500 - 1000", "500 - 1000", "Acephate 75% SP"),
    ("7500", "0", "Chlorantraniliprole 0.4% GR")
]

for fd, w, ft in test_cases:
    print(f"{ft} (Dose: {fd}, Water: {w}) -> {compute_dosage_per_litre(fd, w, ft)}")
