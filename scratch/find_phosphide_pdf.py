import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

pdf_path = 'C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf'
doc = fitz.open(pdf_path)

for p in range(len(doc)):
    text = doc[p].get_text()
    if 'aluminum phosphide' in text.lower() or 'aluminium phosphide' in text.lower():
        print(f"--- Page {p+1} ---")
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for idx, l in enumerate(lines):
            if 'phosphide' in l.lower():
                print('   ', lines[max(0, idx-1):min(len(lines), idx+6)])
