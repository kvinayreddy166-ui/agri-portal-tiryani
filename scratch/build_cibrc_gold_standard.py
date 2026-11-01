import fitz
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

print(f"Loading Level 1 Primary Regulatory Document: {pdf_path}")
print(f"Total pages: {len(doc)}")

def canonical_form_key(s):
    s = s.lower().strip()
    s = s.replace('spinoteram', 'spinetoram')
    s = s.replace('buprofenzin', 'buprofezin')
    s = s.replace('spiropidion', 'spiropidon')
    s = s.replace('pyrifluquinazon', 'pyrifluinazon')
    s = s.replace('allerthrin', 'allethrin')
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablets', 'tab').replace('tablet', 'tab')
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'\(.*?\)', '', s)
    
    def norm_num(m):
        val = float(m.group(1))
        if val == int(val):
            return str(int(val))
        return f"{val:g}"
    
    s = re.sub(r'(\d+(?:\.\d+)?)', norm_num, s)
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

formulation_regex = re.compile(
    r'(?:%|\bg/l\b|\bg/L\b|\bTablet\b|\bTab\b|\bPouch\b|\bCoil\b|\bMat\b|\bChalk\b|\bBait\b|\bVaporiser\b|\bVaporizer\b|\bGel\b|\bDust\b|\bAerosol\b|\bLLIN\b|\bRTU\b|\bSmoke\b)',
    re.IGNORECASE
)

master_cibrc = {}
current_formulation = None
current_raw = None
last_crop = ""

for p_no in range(len(doc)):
    page = doc[p_no]
    tab_finder = page.find_tables()
    for tab in tab_finder.tables:
        rows = tab.extract()
        for row in rows:
            if not row or not any(row):
                continue
            clean = [str(c).strip().replace('\n', ' ') for c in row if c and str(c).strip()]
            if not clean:
                continue
            
            # Check if this row is a formulation header
            is_header = False
            first = clean[0]
            if len(clean) == 1 or (len(clean) == 2 and any(x in clean[1].lower() for x in ['cib', 'rc', 'approved', 'sec', '%'])):
                if formulation_regex.search(first) and len(first) > 4:
                    lower_first = first.lower()
                    if not any(lower_first.startswith(x) for x in ['crop', 'dosage', 'waiting', 'agricultural', 'household', 'name of', 'stored', 'target', 'pest']):
                        is_header = True
            
            if is_header:
                current_raw = first
                current_formulation = canonical_form_key(first)
                last_crop = ""
                if current_formulation not in master_cibrc:
                    master_cibrc[current_formulation] = {
                        "raw_title": current_raw,
                        "canonical_key": current_formulation,
                        "pages": [p_no + 1],
                        "claims": []
                    }
                elif (p_no + 1) not in master_cibrc[current_formulation]["pages"]:
                    master_cibrc[current_formulation]["pages"].append(p_no + 1)
                continue
                
            if current_formulation:
                # Filter out repeated column headers
                if any(x in clean[0].lower() for x in ['crop', 'name of commodity', 'target vector / pest', 'agricultural use', 'household use', 'target pest', 'waiting period']):
                    continue
                
                crop = ""
                pest = ""
                ai_dose = ""
                form_dose = ""
                dilution = ""
                phi = ""
                
                if len(clean) >= 6:
                    crop = clean[0]
                    pest = clean[1]
                    ai_dose = clean[2]
                    form_dose = clean[3]
                    dilution = clean[4]
                    phi = clean[5]
                    last_crop = crop
                elif len(clean) == 5:
                    # check if clean[0] looks like a crop or a pest
                    # if last_crop is present and clean[0] doesn't look like crop header
                    crop = last_crop if last_crop else clean[0]
                    pest = clean[0] if last_crop else clean[1]
                    ai_dose = clean[1] if last_crop else clean[2]
                    form_dose = clean[2] if last_crop else clean[3]
                    dilution = clean[3] if last_crop else clean[4]
                    phi = clean[4] if last_crop else ""
                elif len(clean) == 4:
                    crop = last_crop if last_crop else clean[0]
                    pest = clean[0] if last_crop else clean[1]
                    ai_dose = clean[1] if last_crop else ""
                    form_dose = clean[2] if last_crop else clean[2]
                    dilution = clean[3] if last_crop else clean[3]
                else:
                    continue
                    
                if not pest and not form_dose and not ai_dose:
                    continue
                    
                claim = {
                    "crop": crop,
                    "pest": pest,
                    "ai_dosage": ai_dose,
                    "formulation_dosage": form_dose,
                    "dilution_water": dilution,
                    "phi_days": phi,
                    "page": p_no + 1
                }
                master_cibrc[current_formulation]["claims"].append(claim)

print(f"Extracted {len(master_cibrc)} distinct formulation headers.")
total_claims = sum(len(v["claims"]) for v in master_cibrc.values())
print(f"Total individual approved CIB-RC crop-pest claims extracted: {total_claims}")

with open('scratch/cibrc_gold_standard.json', 'w', encoding='utf-8') as f:
    json.dump(master_cibrc, f, ensure_ascii=False, indent=2)

print("Saved scratch/cibrc_gold_standard.json")
