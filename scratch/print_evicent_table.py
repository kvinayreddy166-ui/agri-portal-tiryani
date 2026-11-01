import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')

for p in [69, 70]: # 0-indexed for pages 70 and 71
    print(f"=== Page {p+1} Tables ===")
    tab_finder = doc[p].find_tables()
    for tab in tab_finder.tables:
        rows = tab.extract()
        for r in rows:
            row_str = " | ".join([str(c).replace('\n', ' ') if c else '' for c in r])
            if any(term in row_str.lower() for term in ['emamectin', 'cauliflower', 'chilli', 'maize', 'tea', 'tomato', 'brinjal']):
                print(row_str)
