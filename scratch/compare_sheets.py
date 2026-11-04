import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)

cml = wb['Combined Master List']
se = wb['Source Entries']

print(f"Combined Master List: {cml.max_row} rows")
print(f"Source Entries: {se.max_row} rows")

cml_chems = set()
for r in range(2, cml.max_row + 1):
    c = cml.cell(r, 2).value
    if c:
        cml_chems.add(c.strip().lower())

se_chems = set()
for r in range(2, se.max_row + 1):
    c = se.cell(r, 2).value
    if c:
        se_chems.add(c.strip().lower())

print("Chems in Source Entries but not in Combined Master List:", se_chems - cml_chems)
