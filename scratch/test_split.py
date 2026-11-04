import openpyxl
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)
ws = wb['Combined Master List']

def split_brands(raw_text):
    # First normalize whitespace
    t = raw_text.replace('\n', ' ').strip()
    
    # Split by | first
    pipe_parts = t.split('|')
    tokens = []
    
    for pp in pipe_parts:
        pp = pp.strip()
        if not pp:
            continue
        # Split by comma or semicolon
        # Also handle cases where a closing paren is immediately followed by a new brand name: e.g. ') Tata Alpha'
        sub_tokens = re.split(r'[,;]|\)\s+(?=[A-Za-z0-9\(\]])', pp)
        for st in sub_tokens:
            st = st.strip()
            if not st:
                continue
            # If st was split on ')\s+', the closing paren got consumed if it was inside the split!
            # Wait: in `\)\s+(?=[A-Za-z0-9])`, the `)` is consumed unless we use lookbehind `(?<=\))\s+(?=[A-Za-z0-9])`!
            tokens.append(st)
    return tokens

# Let's test with lookbehind
def split_brands_lookbehind(raw_text):
    t = raw_text.replace('\n', ' ').strip()
    parts = re.split(r'[,;|]|\s*\|\s*|(?<=\))\s+(?=[A-Za-z0-9\(\]])', t)
    return [p.strip() for p in parts if p.strip()]

for r in range(2, 25):
    chem = ws.cell(r, 2).value
    brands_raw = ws.cell(r, 3).value
    if chem and brands_raw:
        tokens = split_brands_lookbehind(str(brands_raw))
        print(f"Row {r} [{chem}]:")
        for tok in tokens[:8]:
            print(f"   -> '{tok}'")
