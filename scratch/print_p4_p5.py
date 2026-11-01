import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

for p in [3, 4]: # page 4, 5
    page = doc[p]
    text = page.get_text()
    print(f"=== PAGE {p+1} ===")
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    for i, l in enumerate(lines):
        if '15 %' in l or '12g' in l or 'tablet' in l.lower() or 'burrow' in l.lower():
            print(f"  Line {i}: {l}")
            print("   Context:", lines[max(0, i-2):min(len(lines), i+8)])
