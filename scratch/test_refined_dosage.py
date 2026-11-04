import re

def compute_accurate_dose(form_str, spray_fluid, chem_name=""):
    f_clean = form_str.strip().replace('_', '').strip()
    s_clean = spray_fluid.strip()
    chem_lower = chem_name.lower()

    if not f_clean or f_clean == '-':
        return ("As per label", "As per label")
    
    # 1. Detect formulation physical state (Liquid vs Solid)
    liquid_tokens = [r'\bec\b', r'\bsc\b', r'\bsl\b', r'\bfs\b', r'\bod\b', r'\bcs\b', r'\bas\b', r'\be\.c\.', r'\bs\.c\.', r'\bs\.l\.']
    solid_tokens = [r'\bwp\b', r'\bsp\b', r'\bwg\b', r'\bwdg\b', r'\bsg\b', r'\bgr\b', r'\bcg\b', r'\bdp\b', r'\bd\b', r'\bg\b', r'\btablet\b']
    
    is_liquid = any(re.search(pat, chem_lower) for pat in liquid_tokens) or 'ml' in f_clean.lower()
    is_solid = any(re.search(pat, chem_lower) for pat in solid_tokens)
    
    unit = "ml" if is_liquid and not is_solid else "g"
    
    # Check for seed treatment
    if 'seed' in f_clean.lower() or '100 kg' in f_clean.lower():
        return (f"{f_clean}", "Seed treatment (Mix with seed before sowing)")
        
    # Check for tree / plant applications
    if '/tree' in f_clean or 'tree' in f_clean:
        return (f"{f_clean}", "Apply to soil or trunk per tree")
    if '/plant' in f_clean:
        return (f"{f_clean}", "Apply around plant base")
    if '/sucker' in f_clean or 'suckers' in f_clean:
        return (f"{f_clean}", "Apply at sucker base")
        
    # Check for per-litre dilution (e.g. '1-2 ml/liter of water' or '0.5ml/lit')
    if 'ml/lit' in f_clean.lower() or 'ml/l' in f_clean.lower() or 'ml/ lit' in f_clean.lower():
        m = re.findall(r'(\d+(?:\.\d+)?)', f_clean)
        if m:
            nums = [float(x) for x in m if float(x) < 50]
            if nums:
                acre_str = f"{nums[0]}–{nums[1]} ml / L water" if len(nums) > 1 else f"{nums[0]} ml / L water"
                pump_vals = [round(x * 15, 1) for x in nums]
                pump_str = f"{pump_vals[0]}–{pump_vals[1]} ml per 15L pump" if len(pump_vals) > 1 else f"{pump_vals[0]} ml per 15L pump"
                return (acre_str, pump_str)
                
    # Check for tablet
    if 'tablet' in chem_lower:
        return ("1 tablet per 30 m²", "Fumigation / Space treatment")
        
    # Remove parenthetical concentrations, e.g. "750 (0.075)" -> "750"
    f_normalized = re.sub(r'\s*\(\s*\d+(?:\.\d+)?%?\s*\)', '', f_clean)
    
    # Fix broken space in numbers, e.g. "10 000" -> "10000"
    f_normalized = re.sub(r'(\d+)\s+(\d{3})\b', r'\1\2', f_normalized)
    
    # Check for tiny decimals indicating % spray solution concentration (e.g. 0.04-0.05 or 0.0004)
    m_all = re.findall(r'(\d+(?:\.\d+)?)', f_normalized)
    if m_all:
        nums = [float(x) for x in m_all if x and x != '.']
        if nums and max(nums) < 0.1:
            acre_str = f"{nums[0]}–{nums[1]}% conc." if len(nums) > 1 else f"{nums[0]}% conc."
            pump_vals = [round(x * 10 * 15, 1) for x in nums]
            pump_str = f"{pump_vals[0]}–{pump_vals[1]} {unit} per 15L pump" if len(pump_vals) > 1 else f"{pump_vals[0]} {unit} per 15L pump"
            return (acre_str, pump_str)
            
        # Bt / Bio-pesticides given in kg/ha (e.g. 1.0-1.5 or 0.6-1.0 or 1.5-2.0)
        is_bt_or_kg = 'bacillus' in chem_lower or 'kg' in f_clean.lower() or (nums and max(nums) <= 5.0 and 'gr' not in chem_lower and 'cg' not in chem_lower)
        if is_bt_or_kg and max(nums) <= 5.0:
            nums = [n * 1000 for n in nums]
            unit = "g"
            
        # True Granule / Soil applications: strictly granular formulations or heavy dust powders
        is_granular = any(re.search(pat, chem_lower) for pat in [r'\bgr\b', r'\bcg\b', r'\bg\b', r'\bdp\b', r'\bd\b'])
        is_soil_app = is_granular and not is_liquid
        
        # Standard conversion: 1 Hectare = 2.471 Acres
        acre_nums = [n / 2.471 for n in nums]
        
        if is_soil_app and max(nums) >= 1000:
            acre_kg = [round(n / 1000, 1) for n in acre_nums]
            acre_str = f"{acre_kg[0]}–{acre_kg[1]} kg/acre" if len(acre_kg) > 1 else f"{acre_kg[0]} kg/acre"
            pump_str = "Soil application / Broadcasting (No pump)"
            return (acre_str, pump_str)
        else:
            acre_val = [round(n) for n in acre_nums]
            acre_str = f"{acre_val[0]}–{acre_val[1]} {unit}/acre" if len(acre_val) > 1 else f"{acre_val[0]} {unit}/acre"
            
            # Standard backpack knapsack pump: 1 acre requires approx 10 pumps (150-200 L water)
            pump_vals = [round(n / 10.0, 1) for n in acre_nums]
            pump_str = f"{pump_vals[0]}–{pump_vals[1]} {unit} per 15L pump" if len(pump_vals) > 1 else f"{pump_vals[0]} {unit} per 15L pump"
            return (acre_str, pump_str)
            
    return (form_str, "Follow product label guidelines")

test_neem = [
    ("Azadirachtin 0.03% (300 ppm)", "2500-5000", "500-1000"),
    ("Chlorpyrifos 20 EC", "5000", "500-1000"),
    ("Phorate 10 CG", "10000", ""),
    ("Chlorantraniliprole 0.4 GR", "10 000", ""),
]

for chem, form, fluid in test_neem:
    a, p = compute_accurate_dose(form, fluid, chem)
    print(f"{chem:<32} | Form: {form:<10} -> Acre: {a:<18} | Pump: {p}")
