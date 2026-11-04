import openpyxl
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)
ws = wb['Combined Master List']

def clean_brand_name(brand_str, chemical_name=""):
    """
    Cleans a brand string token.
    E.g.
    'Abacin (Crystal)' -> 'Abacin (Crystal)'
    'Acephate 75% SP Starthene (Swal)' -> 'Starthene (Swal)'
    'Asataf(Tata)' -> 'Asataf (Tata)'
    'FMC Talstar Plus' -> 'Talstar Plus (FMC)' or 'FMC Talstar Plus'
    '(Adama) Trassid' -> 'Trassid (Adama)'
    '(Best Agrolife) AXEMAN' -> 'AXEMAN (Best Agrolife)'
    """
    b = brand_str.strip()
    if not b:
        return None
    
    # Strip any trailing periods or commas
    b = b.strip(' .,;:/|')
    
    # Remove junk descriptions accidentally in brand string
    # e.g., 'Neonicotinoids group', 'Synthetic pyrethroid group', 'Organochlorine group', 'Urcouples of oxidative...'
    junk_phrases = [
        r'neonicotinoids\s+group.*',
        r'synthetic\s+pyrethroid\s+group.*',
        r'organochlorine\s+group.*',
        r'urcouples\s+of\s+oxidative.*',
        r'non-systemic.*',
        r'systemic\s+insecticide.*',
        r'contact\s+and\s+stomach.*',
    ]
    for jp in junk_phrases:
        b = re.sub(jp, '', b, flags=re.IGNORECASE).strip()
    
    if not b:
        return None
        
    # If starts with (Company) Brand, e.g. '(Adama) Trassid' -> 'Trassid (Adama)'
    m_comp_prefix = re.match(r'^\(([^)]+)\)\s*(.+)$', b)
    if m_comp_prefix:
        comp, brand = m_comp_prefix.groups()
        b = f"{brand.strip()} ({comp.strip()})"
        
    # If starts with Company Brand where company is FMC, EBS, etc.
    # e.g. 'FMC Talstar Plus' -> 'Talstar Plus (FMC)'
    # 'EBS Feno-50' -> 'Feno-50 (EBS)'
    # 'Sumitomo COMMANDO' -> 'COMMANDO (Sumitomo)'
    m_comp_brand = re.match(r'^(FMC|EBS|Sumitomo)\s+([A-Za-z0-9\-\s\+]+)$', b, re.IGNORECASE)
    if m_comp_brand and not '(' in b:
        comp, brand = m_comp_brand.groups()
        b = f"{brand.strip()} ({comp.strip()})"
        
    # If brand has no space before bracket: 'Asataf(Tata)' -> 'Asataf (Tata)'
    b = re.sub(r'([A-Za-z0-9])\(', r'\1 (', b)
    
    # Remove chemical formulation prefix if present at start
    # e.g. 'Acephate 75% SP Starthene (Swal)' -> 'Starthene (Swal)'
    # 'Alphamethrin 10% EC Mig10 (Devidayal)' -> 'Mig10 (Devidayal)'
    # 'Abamectin 1.8% EC Vertimec (Syngenta)' -> 'Vertimec (Syngenta)'
    if chemical_name:
        # Check if chemical name or active ingredient + % is at start
        chem_clean = chemical_name.strip()
        # regex for chemical + percentage + formulation
        b = re.sub(r'^' + re.escape(chem_clean) + r'\s*', '', b, flags=re.IGNORECASE).strip()
        # Also try just active ingredient + form:
        words = chem_clean.split()
        if len(words) >= 2:
            first_two = " ".join(words[:2])
            b = re.sub(r'^' + re.escape(first_two) + r'\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', b, flags=re.IGNORECASE).strip()
            
    # Also generic strip of leading formulation prefixes like "10% EC ", "75% SP " etc.
    b = re.sub(r'^\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', b, flags=re.IGNORECASE).strip()
    
    if not b:
        return None
        
    return b

print("Testing cleaning functions...")
for r in range(2, 20):
    chem = ws.cell(r, 2).value
    brands_raw = ws.cell(r, 3).value
    if chem and brands_raw:
        # split by | and ,
        parts = re.split(r'[,|]', str(brands_raw))
        cleaned = []
        for p in parts:
            c = clean_brand_name(p, chem)
            if c and c not in cleaned:
                cleaned.append(c)
        print(f"[{chem}] => {cleaned}")
