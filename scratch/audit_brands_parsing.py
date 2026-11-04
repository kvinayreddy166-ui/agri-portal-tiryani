import openpyxl
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

def clean_brand_token(token, chem_name=""):
    t = token.strip()
    if not t:
        return None
    
    # Strip any enclosing or leading/trailing noise
    t = t.strip(' .,;:/|')
    
    # Remove junk descriptions
    junk_patterns = [
        r'neonicotinoids\s+group.*',
        r'synthetic\s+pyrethroid\s+group.*',
        r'organochlorine\s+group.*',
        r'urcouples\s+of\s+oxidative.*',
        r'non-systemic.*',
        r'systemic\s+insecticide.*',
        r'contact\s+and\s+stomach.*',
        r'broad\s+spectrum.*',
        r'chloronicotinyl\s+group.*',
    ]
    for jp in junk_patterns:
        t = re.sub(jp, '', t, flags=re.IGNORECASE).strip()
        
    if not t:
        return None
        
    # Handle (Company) Brand -> Brand (Company)
    m = re.match(r'^\(([^)]+)\)\s*(.+)$', t)
    if m:
        comp, brand = m.groups()
        t = f"{brand.strip()} ({comp.strip()})"
        
    # Handle Company Brand where company has no brackets at start:
    # E.g. 'FMC Talstar Plus' -> 'Talstar Plus (FMC)'
    # 'EBS Feno-50' -> 'Feno-50 (EBS)'
    # 'Sumitomo COMMANDO' -> 'COMMANDO (Sumitomo)'
    # 'Multiplex Nagfen-D' -> 'Nagfen-D (Multiplex)'
    known_prefix_companies = ['FMC', 'EBS', 'Sumitomo', 'Multiplex', 'Best Agrolife', 'PI', 'Adama']
    for comp in known_prefix_companies:
        m = re.match(r'^' + re.escape(comp) + r'\s+([A-Za-z0-9\-\s\+\.]+)', t, flags=re.IGNORECASE)
        if m and '(' not in t:
            brand = m.group(1).strip()
            t = f"{brand} ({comp})"
            break
            
    # Fix missing space before paren: 'Asataf(Tata)' -> 'Asataf (Tata)'
    t = re.sub(r'([A-Za-z0-9])\(', r'\1 (', t)
    
    # Strip chemical name prefixes from brand:
    # E.g. 'Acephate 75% SP Starthene (Swal)' -> 'Starthene (Swal)'
    # 'Chlorpyrifos 20% EC Krishan 20 (KR)' -> 'Krishan 20 (KR)'
    # 'Alpha-Cypermethrin 10% WP Alfastar (Swal)' -> 'Alfastar (Swal)'
    if chem_name:
        cn = chem_name.strip()
        t = re.sub(r'^' + re.escape(cn) + r'\s*', '', t, flags=re.IGNORECASE).strip()
        # Also try first word / active name
        words = cn.split()
        if len(words) >= 1:
            w0 = words[0]
            # e.g. "Acephate ...", "Abamectin ..."
            t = re.sub(r'^' + re.escape(w0) + r'\s+\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', t, flags=re.IGNORECASE).strip()
            
    # Also generic strip of leading formulation prefixes like "10% EC ", "75% SP " etc.
    t = re.sub(r'^\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?\s*', '', t, flags=re.IGNORECASE).strip()
    
    # If the token is just a formulation like '50% SP' or 'EC', drop it
    if re.match(r'^\d+(\.\d+)?%\s*(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)?$', t, flags=re.IGNORECASE):
        return None
    if re.match(r'^(EC|SC|SP|WP|WG|WDG|SL|GR|OD|DP|SG|FS|ZC|SE|DS|CS)$', t, flags=re.IGNORECASE):
        return None
        
    t = t.strip(' .,;:/|')
    if not t:
        return None
        
    return t

def parse_brands_string(raw_text, chem_name=""):
    if not raw_text:
        return []
    # Replace newlines
    text = raw_text.replace('\n', ' ').strip()
    # Split by | or comma or semicolon or lookbehind on )
    tokens = re.split(r'[,;|]|\s*\|\s*|(?<=\))\s+(?=[A-Za-z0-9\(\]])', text)
    
    cleaned = []
    seen = set()
    for tok in tokens:
        c = clean_brand_token(tok, chem_name)
        if not c:
            continue
        key = c.lower().replace(' ', '')
        if key not in seen:
            seen.add(key)
            cleaned.append(c)
    return cleaned

for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    raw = ws.cell(r, 3).value
    if chem:
        chem = chem.strip()
        brands = parse_brands_string(str(raw), chem)
        print(f"[{int(sno) if isinstance(sno, float) else sno}] {chem}:")
        print(f"    Raw: {raw}")
        print(f"    Parsed ({len(brands)}): {brands}")
        print()
