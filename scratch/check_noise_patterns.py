import openpyxl
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    raw = ws.cell(r, 3).value
    if raw:
        t = str(raw).strip()
        # check unclosed paren
        if t.count('(') != t.count(')'):
            print(f"Row {r} [S.No {sno}] {chem}: UNBALANCED PARENS: {t[-60:]}")
        # check keywords
        for kw in ['photostable', 'chewing', 'animal', 'termites', 'forestry', 'group of', 'mode of action', 'disruption of the proton']:
            if kw in t.lower():
                print(f"Row {r} [S.No {sno}] {chem}: KEYWORD '{kw}': {t}")
