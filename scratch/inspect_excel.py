import openpyxl
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)

print("Sheet names:", wb.sheetnames)

for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\n--- Sheet: {sheet_name} (Rows: {ws.max_row}, Cols: {ws.max_column}) ---")
    headers = [ws.cell(1, col).value for col in range(1, ws.max_column + 1)]
    print("Headers:", headers)
    for r in range(2, min(7, ws.max_row + 1)):
        row_vals = [ws.cell(r, col).value for col in range(1, ws.max_column + 1)]
        print(f"Row {r}: {row_vals[:4]}")
