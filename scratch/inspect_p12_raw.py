import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

page = doc[11] # page 12 (0-indexed)
tabs = page.find_tables()
for t in tabs:
    rows = t.extract()
    for r in rows[:6]:
        print("ROW:", [str(c).strip().replace('\n', ' ') if c else '' for c in r])
