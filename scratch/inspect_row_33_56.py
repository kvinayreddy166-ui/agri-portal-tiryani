import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx')
ws = wb['Combined Master List']

print("Row 33:", ws.cell(34, 3).value)
print()
print("Row 56:", ws.cell(57, 3).value)
