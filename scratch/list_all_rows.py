import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)
ws = wb['Combined Master List']

for r in range(2, ws.max_row + 1):
    sno = ws.cell(r, 1).value
    chem = ws.cell(r, 2).value
    brands = ws.cell(r, 3).value
    if chem:
        print(f"{int(sno) if isinstance(sno, float) else sno} | {chem.strip()} | {str(brands)[:100]}")
