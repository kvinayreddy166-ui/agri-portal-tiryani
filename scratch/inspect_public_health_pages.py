import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

print(f"Total pages: {len(doc)}")
for p in range(93, 108):
    text = doc[p].get_text()
    first_few_lines = [l.strip() for l in text.split('\n') if l.strip()][:5]
    print(f"Page {p+1}:", ' | '.join(first_few_lines))
