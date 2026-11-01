import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

p2 = doc[1]
tabs = p2.find_tables().tables
print(f'Page 2 tables found: {len(tabs)}')
for t_idx, table in enumerate(tabs):
    df = table.extract()
    print(f'--- Table {t_idx+1} ({len(df)} rows) ---')
    for row in df[:8]:
        print([str(cell).replace('\n', ' ') if cell else '' for cell in row])
