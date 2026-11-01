import fitz
import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

def norm_formulation(s):
    s = s.lower().strip()
    s = s.replace('%w/w', '%').replace('%w/v', '%').replace('%m/m', '%')
    s = s.replace('w/w', '').replace('w/v', '').replace('m/m', '')
    s = re.sub(r'0+(\d)', r'\1', s)
    s = re.sub(r'[^a-z0-9]', '', s)
    s = s.replace('chlorpyriphos', 'chlorpyrifos')
    s = s.replace('aluminum', 'aluminium')
    s = s.replace('tablet', 'tab')
    return s

all_cibrc_data = {}
current_formulation = None

formulation_regex = re.compile(
    r'(?:%|\bg/l\b|\bg/L\b|\bTablet\b|\bTab\b|\bPouch\b|\bCoil\b|\bMat\b|\bChalk\b|\bBait\b|\bVaporiser\b|\bVaporizer\b|\bGel\b|\bDust\b|\bAerosol\b|\bLLIN\b|\bRTU\b|\bSmoke\b)',
    re.IGNORECASE
)

for p_idx in range(len(doc)):
    page = doc[p_idx]
    tab_finder = page.find_tables()
    for tab in tab_finder.tables:
        rows = tab.extract()
        for row in rows:
            if not row or not any(row):
                continue
            cells = [str(c).strip().replace('\n', ' ') if c else '' for c in row]
            first_cell = cells[0]
            
            # Check if this row is a formulation header
            # Usually cells[1:] are empty or first cell has a formulation keyword
            is_header = False
            if formulation_regex.search(first_cell) and len(first_cell) > 5 and not first_cell.lower().startswith('crop') and not first_cell.lower().startswith('dosage') and not first_cell.lower().startswith('waiting') and not first_cell.lower().startswith('agricultural'):
                # check if remaining cells are mostly empty
                non_empty_rest = sum(1 for c in cells[1:] if c)
                if non_empty_rest <= 1:
                    is_header = True
            
            if is_header:
                current_formulation = first_cell
                norm_key = norm_formulation(first_cell)
                if norm_key not in all_cibrc_data:
                    all_cibrc_data[norm_key] = {
                        'raw_name': current_formulation,
                        'page': p_idx + 1,
                        'crops': [],
                        'pests': [],
                        'dosages': [],
                        'dilutions': [],
                        'waiting_periods': []
                    }
                continue
            
            # If not header, and we have a current_formulation, parse row
            if current_formulation and len(cells) >= 3:
                norm_key = norm_formulation(current_formulation)
                crop = cells[0]
                pest = cells[1] if len(cells) > 1 else ''
                dosage = cells[3] if len(cells) > 3 and cells[3] else (cells[2] if len(cells) > 2 else '')
                dilution = cells[4] if len(cells) > 4 else ''
                phi = cells[5] if len(cells) > 5 else (cells[-1] if len(cells) > 3 else '')
                
                # Filter out table header repeats
                if crop.lower() in ['crop', 'name of commodity', '', 'target vector / pest', 'agricultural use', 'household use']:
                    continue
                if crop and crop not in all_cibrc_data[norm_key]['crops']:
                    all_cibrc_data[norm_key]['crops'].append(crop)
                if pest and pest not in all_cibrc_data[norm_key]['pests']:
                    all_cibrc_data[norm_key]['pests'].append(pest)
                if dosage and dosage not in all_cibrc_data[norm_key]['dosages']:
                    all_cibrc_data[norm_key]['dosages'].append(dosage)
                if dilution and dilution not in all_cibrc_data[norm_key]['dilutions']:
                    all_cibrc_data[norm_key]['dilutions'].append(dilution)
                if phi and phi not in all_cibrc_data[norm_key]['waiting_periods']:
                    all_cibrc_data[norm_key]['waiting_periods'].append(phi)

print(f'Extracted {len(all_cibrc_data)} formulations with full table data from 108 pages.')

with open('scratch/cibrc_extracted_tables.json', 'w', encoding='utf-8') as f:
    json.dump(all_cibrc_data, f, ensure_ascii=False, indent=2)

print('Saved scratch/cibrc_extracted_tables.json')
