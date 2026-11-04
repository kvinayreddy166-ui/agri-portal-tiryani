import openpyxl
import sys

sys.stdout.reconfigure(encoding='utf-8')

file_path = 'C:/Users/kvina/.gemini/antigravity/brain/ff3a2d22-8b6c-4d24-84bf-78fd6d8e574d/.user_uploaded/media_1793720425390_db144b9b.xlsx'
wb = openpyxl.load_workbook(file_path)

cml = wb['Combined Master List']
se = wb['Source Entries']

print("--- Source Entries Sources ---")
source_col = [se.cell(r, 7).value for r in range(2, se.max_row + 1)]
sources = set(source_col)
print("Unique sources in Source Entries:", sources)

# Let's count how many from each source
from collections import Counter
print("Counts by source:", Counter(source_col))
