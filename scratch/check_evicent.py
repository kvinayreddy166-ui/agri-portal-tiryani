import re
import fitz
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("--- 1. Checking agrochemicalsData.ts ---")
with open('project/src/features/agrochemicals/data/agrochemicalsData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'\{\s*(?:["\']?id["\']?)\s*:\s*["\']([^"\']+)["\'](?P<content>.*?)\n\s*\}', text, re.DOTALL):
    iid = m.group(1)
    content = m.group('content')
    if 'lufenuron' in iid.lower() or 'lufenuron' in content.lower():
        print(f"ID: {iid}")
        for line in content.split('\n'):
            line_str = line.strip()
            if any(k in line_str for k in ['name', 'popularBrands', 'dosagePerAcre', 'dosagePerLitre', 'waitingPeriodDays', 'targetCrops', 'targetPests']):
                print(f"  {line_str}")
        print()

print("--- 2. Checking 108-page CIB-RC PDF ---")
doc = fitz.open('C:/Users/kvina/.gemini/antigravity/brain/bea0bda0-c99e-4a62-823a-373d7d9e3fc4/.user_uploaded/media_1793551578979_52c130a1.pdf')
for p in range(len(doc)):
    page_text = doc[p].get_text()
    if 'lufenuron' in page_text.lower():
        print(f"Found 'lufenuron' on page {p+1}:")
        lines = [l.strip() for l in page_text.split('\n') if l.strip()]
        for idx, l in enumerate(lines):
            if 'lufenuron' in l.lower() or 'evicent' in l.lower() or '40%' in l:
                # print context
                start = max(0, idx - 5)
                end = min(len(lines), idx + 20)
                for c in lines[start:end]:
                    print(f"    {c}")
                print("    ---")
