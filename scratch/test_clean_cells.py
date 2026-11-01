import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

for p_no in [1, 11, 28, 69]: # p2, p12, p29, p70
    page = doc[p_no]
    tabs = page.find_tables()
    for t in tabs:
        rows = t.extract()
        for r in rows:
            clean_cells = [str(c).strip().replace('\n', ' ') for c in r if c and str(c).strip()]
            if len(clean_cells) >= 4:
                # check if first cell is not header
                if any(x in clean_cells[0].lower() for x in ['crop', 'dosage', 'waiting', 'name of']):
                    continue
                print(f"Page {p_no+1} Row:", clean_cells)
                break
