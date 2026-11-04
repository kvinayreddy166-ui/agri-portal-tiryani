import json
import re

with open('scratch/extracted_crop_pest_insecticides.json', 'r', encoding='utf-8') as f:
    pdf_rows = json.load(f)

print(f"Loaded {len(pdf_rows)} rows from PDF extraction.")

# Load existing TS items
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    ts_text = f.read()

items_raw = re.findall(r'\{\s*"id":\s*"([^"]+)",(.*?)\n  \}', ts_text, re.DOTALL)
existing_items = {}
for item_id, body in items_raw:
    full_str = '{\n    "id": "' + item_id + '",' + body + '\n  }'
    try:
        obj = json.loads(full_str)
        existing_items[obj["name"].lower().strip()] = obj
    except:
        pass

print(f"Loaded {len(existing_items)} existing items from TS.")

# Test dose parser
def compute_acre_and_pump_dose(form_str, spray_str):
    form_str = form_str.strip().replace('_', '').strip()
    if not form_str or form_str == '-':
        return ("As per label", "As per label")
    
    # Check tree/plant/sucker/seed/kg
    if '/tree' in form_str or 'tree' in form_str:
        return (f"{form_str}", "Apply to soil/trunk per tree")
    if '/sucker' in form_str or 'suckers' in form_str:
        return (f"{form_str}", "Apply near sucker base")
    if '/plant' in form_str:
        return (f"{form_str}", "Apply around plant base")
    if 'seed' in form_str.lower() or '100 kg' in form_str.lower():
        return (f"{form_str}", "Seed treatment")
    if 'ml/lit' in form_str.lower() or 'ml/l' in form_str.lower():
        # e.g. 7.5ml/lit
        m = re.search(r'([\d.]+)', form_str)
        if m:
            val = float(m.group(1))
            pump_val = round(val * 15, 1)
            return (f"{val} ml / Litre of water", f"{pump_val} ml per 15L pump")
        return (f"{form_str}", "Dilute per litre of water")
        
    # Check if range e.g. 1500-2000 or single 150
    m_range = re.findall(r'([\d.]+)', form_str)
    if m_range:
        nums = [float(x) for x in m_range]
        is_large = max(nums) >= 5000  # likely dust or granules (gm/ha)
        
        # Determine unit
        unit = "g"
        if "ml" in form_str.lower():
            unit = "ml"
        elif "kg" in form_str.lower():
            unit = "kg"
            nums = [n * 1000 for n in nums] # convert to g
        elif is_large:
            unit = "g"
            
        acre_nums = [n / 2.471 for n in nums]
        if is_large: # Dust / granules in kg/acre
            acre_kg = [round(n / 1000, 1) for n in acre_nums]
            if len(acre_kg) == 1:
                acre_str = f"{acre_kg[0]} kg / acre"
            else:
                acre_str = f"{acre_kg[0]}–{acre_kg[1]} kg / acre"
            pump_str = "Soil application / Dusting (No pump)"
            return (acre_str, pump_str)
        else:
            acre_val = [round(n) for n in acre_nums]
            if len(acre_val) == 1:
                acre_str = f"{acre_val[0]} {unit}/acre"
            else:
                acre_str = f"{acre_val[0]}–{acre_val[1]} {unit}/acre"
                
            # Pump dose based on ~200L/acre (13 pumps)
            pump_vals = [round(n / 13.3, 1) for n in acre_nums]
            if len(pump_vals) == 1:
                pump_str = f"{pump_vals[0]} {unit} per 15L pump"
            else:
                pump_str = f"{pump_vals[0]}–{pump_vals[1]} {unit} per 15L pump"
            return (acre_str, pump_str)
            
    return (form_str, "Follow label directions")

sample_cases = [
    ("150", "500"),
    ("1500-2000", "500-1000"),
    ("33300", "-"),
    ("7.5ml/lit", "10 lit/tree"),
    ("166/tree", ""),
    ("50g/suckers", "")
]
for f_str, s_str in sample_cases:
    acre, pump = compute_acre_and_pump_dose(f_str, s_str)
    print(f"Form: {f_str:15} -> Acre: {acre:25} | Pump: {pump}")
